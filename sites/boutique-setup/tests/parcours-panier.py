#!/usr/bin/env python3
"""
Ligne Posée — parcours navigateur du lot 2 (panier et commande simulée), mobile first.

Lancer (Python 3 + playwright + Chromium, rien à installer côté site) :
    python3 sites/boutique-setup/tests/parcours-panier.py <dossier-servi> [chromium]
où <dossier-servi> est la sortie assemblée (sites/boutique-setup/dist) ou, pour un essai rapide,
le dossier source du site. Le script sert ce dossier lui-même (404 réelle, POST refusé) sur un
port libre, joue les parcours à 320, 375, 768 et 1440 px, puis les scénarios de panne à 320 et
1440 px. Les montants attendus sont recalculés depuis data/catalogue.json. Code de sortie 1 au
moindre écart. Ce fichier n'est ni listé dans publication.json ni publié.
"""
import http.server, json, os, socketserver, sys, threading, urllib.parse
from playwright.sync_api import sync_playwright

RACINE = os.path.abspath(sys.argv[1])
CHROMIUM = sys.argv[2] if len(sys.argv) > 2 else os.environ.get("CHROMIUM", "/opt/pw-browsers/chromium")
CAT = json.load(open(os.path.join(RACINE, "data/catalogue.json"), encoding="utf-8"))
PRIX = {r["sku"]: r["prixCents"] for r in CAT["references"]}
MODELE = {m["id"]: m for m in CAT["modeles"]}
CLE_ETAT = "lignePosee.v2.etat"  # une seule clé active : panier + dernière confirmation (L2-01)
CLE_PANIER_V1, CLE_CONF_V1 = "lignePosee.v1.panier", "lignePosee.v1.confirmation"  # anciennes, lues puis nettoyées
ETR = "autre-site.preferences"
SKU_A, SKU_B = "LP-SUP-03-04", "LP-LUM-01-02"  # 169 € ; prix lu dans le catalogue
MIME = {".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8"}


class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        p = urllib.parse.urlparse(self.path).path
        if p.endswith("/"):
            p += "index.html"
        f = os.path.normpath(os.path.join(RACINE, p.lstrip("/")))
        st = 200
        if not f.startswith(RACINE) or not os.path.isfile(f) or os.path.basename(f) == "_headers":
            f, st = os.path.join(RACINE, "404.html"), 404
        d = open(f, "rb").read()
        self.send_response(st)
        self.send_header("Content-Type", MIME.get(os.path.splitext(f)[1], "application/octet-stream"))
        self.send_header("Content-Length", str(len(d)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(d)

    def do_POST(self):
        self.send_response(405)
        self.end_headers()

    def log_message(self, *a):
        pass


socketserver.TCPServer.allow_reuse_address = True
SRV = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
BASE = f"http://127.0.0.1:{SRV.server_address[1]}"
threading.Thread(target=SRV.serve_forever, daemon=True).start()

KO, NB = [], [0]


def check(nom, cond, detail=""):
    NB[0] += 1
    print(("OK  " if cond else "KO  ") + nom + ("" if cond else f"  → {detail}"), flush=True)
    if not cond:
        KO.append(nom)


def fmt(c):
    e, r = divmod(c, 100)
    return f"{e:,}".replace(",", " ") + f",{r:02d} €"


def txt(pg, sel="main"):
    return pg.inner_text(sel).replace(" ", " ").replace(" ", " ")


def norm(s):
    return s.replace(" ", " ").replace(" ", " ")


JOURNAL = """(()=>{const o=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){try{const l=JSON.parse(window.name||'[]');l.push(k);window.name=JSON.stringify(l)}catch(e){window.name=JSON.stringify([k])}return o.call(this,k,v)}})()"""
ETRANGER = "sessionStorage.setItem('autre-site.preferences','ne pas toucher')"


class Contexte:
    def __init__(self, b, w, **kw):
        tactile = w < 768
        self.ctx = b.new_context(viewport={"width": w, "height": 800}, has_touch=tactile, **kw)
        self.w, self.tactile = w, tactile
        self.requetes, self.erreurs = [], []
        self.ctx.on("request", lambda r: self.requetes.append((r.method, r.url)))
        self.ctx.add_init_script(JOURNAL)

    def page(self):
        pg = self.ctx.new_page()
        pg.on("pageerror", lambda e: self.erreurs.append(str(e)))
        return pg

    def agir(self, loc):
        loc.scroll_into_view_if_needed()
        (loc.tap if self.tactile else loc.click)()


def stock(pg):
    return pg.evaluate("Object.fromEntries(Object.entries(sessionStorage))")


def etat_stocke(pg):
    brut = stock(pg).get(CLE_ETAT)
    return None if brut is None else json.loads(brut)


def panier_stocke(pg):
    """Panier au format {v:1, lignes} ; None si aucun état ou panier vide."""
    e = etat_stocke(pg)
    return None if e is None or not e["lignes"] else {"v": 1, "lignes": e["lignes"]}


def conf_stockee(pg):
    e = etat_stocke(pg)
    return None if e is None else e.get("confirmation")


def etat_json(lignes, conf=None):
    return json.dumps({"v": 2, "lignes": lignes, "confirmation": conf})


def capture_ancienne():
    """Une confirmation antérieure valide (autre commande : 1 × LP-TAP-01-01, Express)."""
    sku = "LP-TAP-01-01"
    return {"v": 1, "lignes": [{"sku": sku, "modele": "Ancien modèle", "finition": "Ancienne finition", "prixCents": PRIX[sku], "quantite": 1, "sousTotalCents": PRIX[sku]}],
            "livraison": {"id": "express", "libelle": "Express", "cents": 990}, "produitsCents": PRIX[sku], "totalCents": PRIX[sku] + 990}


def sans_debordement(pg, nom):
    d = pg.evaluate("({sw: document.documentElement.scrollWidth, iw: window.innerWidth})")
    check(f"{nom} : aucun débordement horizontal ({d['sw']} ≤ {d['iw']})", d["sw"] <= d["iw"], d)


def dans_ecran(pg, loc, nom):
    loc.scroll_into_view_if_needed()
    bb = loc.bounding_box()
    iw = pg.evaluate("window.innerWidth")
    check(f"{nom} : entièrement dans l'écran, hauteur ≥ 43 px", bb and bb["x"] >= 0 and bb["x"] + bb["width"] <= iw + 0.5 and bb["height"] >= 43, bb)


def ajouter_depuis_fiche(c, pg, modele, variante, attendu_q):
    pg.goto(f"{BASE}/produit.html?modele={modele}&variante={variante}")
    pg.wait_for_selector("#ajouter")
    c.agir(pg.locator("#ajouter"))
    sku = f"LP-{modele[:3].upper()}-{modele[4:]}-{variante}"
    retour = txt(pg, "#achat-retour")
    check(f"fiche {modele}/{variante} : retour perceptible (SKU {sku}, quantité {attendu_q}) et lien vers le panier",
          sku in retour and f"panier : {attendu_q}." in retour and pg.get_by_role("link", name="Voir le panier").is_visible(), retour)
    return sku


def parcours(b, w):
    print(f"\n=== Parcours complet à {w} px", flush=True)
    c = Contexte(b, w)
    pg = c.page()
    pg.goto(BASE + "/index.html")
    pg.evaluate(ETRANGER)
    # --- 1. Ajouts depuis deux fiches de modèles différents, puis réajout du premier
    a = ajouter_depuis_fiche(c, pg, "sup-03", "04", 1)
    sans_debordement(pg, "fiche après ajout")
    dans_ecran(pg, pg.locator("#ajouter"), "bouton « Ajouter au panier »")
    b_ = ajouter_depuis_fiche(c, pg, "lum-01", "02", 1)
    ajouter_depuis_fiche(c, pg, "sup-03", "04", 2)
    check("stockage : deux lignes, SKU et quantités exacts, aucun prix ni nom conservé",
          panier_stocke(pg) == {"v": 1, "lignes": [{"sku": a, "quantity": 2}, {"sku": b_, "quantity": 1}]}, panier_stocke(pg))
    # variante différente sur la fiche : le message précédent disparaît et le SKU ajouté est celui affiché
    pg.goto(f"{BASE}/produit.html?modele=tap-01&variante=01")
    pg.wait_for_selector("#ajouter")
    c.agir(pg.locator("#ajouter"))
    pg.locator('label.variante:has(input[value="03"])').click()
    check("changer de variante efface le message d'ajout précédent", txt(pg, "#achat-retour") == "")
    c.agir(pg.locator("#ajouter"))
    sku_tap = "LP-TAP-01-03"
    check("la variante sélectionnée (03) est ajoutée, pas la précédente", {l["sku"] for l in panier_stocke(pg)["lignes"]} == {a, b_, "LP-TAP-01-01", sku_tap}, panier_stocke(pg))

    # --- 2. Panier : lignes, libellés, prix, quantités
    pg.goto(BASE + "/panier.html")
    pg.wait_for_selector(".ligne-panier")
    sans_debordement(pg, "panier à 4 lignes")
    lignes = pg.locator(".ligne-panier")
    check("panier : 4 lignes, une par SKU", lignes.count() == 4, lignes.count())
    ligne_a = pg.locator(".ligne-panier", has_text=a)
    t = norm(ligne_a.inner_text())
    check("ligne SKU A : modèle, finition, SKU, prix unitaire, sous-total",
          MODELE["sup-03"]["nom"] in t and "Aspect aluminium brossé" in t and a in t and norm(fmt(PRIX[a])) in t and norm(fmt(PRIX[a] * 2)) in t, t)
    check("quantité affichée = 2", pg.input_value(f"#qte-{a}") == "2")
    total = sum(PRIX[x["sku"]] * x["quantity"] for x in panier_stocke(pg)["lignes"])
    check(f"total des produits = somme exacte en centimes ({fmt(total)})", norm(fmt(total)) in txt(pg, ".totaux"), txt(pg, ".totaux"))
    # quantités valides et refusées
    for valeur, ok in [("99", True), ("1", True), ("0", False), ("100", False), ("1.5", False), ("abc", False), ("", False), ("-3", False)]:
        pg.evaluate("([id, v]) => { const i = document.getElementById(id); i.value = v; i.dispatchEvent(new Event('change', {bubbles: true})); }", [f"qte-{a}", valeur])
        pg.wait_for_selector(f"#qte-{a}")
        q = panier_stocke(pg)["lignes"][0]["quantity"]
        if ok:
            check(f"quantité {valeur!r} acceptée, enregistrée", q == int(valeur), q)
        else:
            err = pg.locator(".erreur-champ")
            check(f"quantité {valeur!r} refusée avec message, valeur enregistrée conservée ({q}), champ remis à {q}",
                  err.count() == 1 and "1 à 99" in err.inner_text() and pg.input_value(f"#qte-{a}") == str(q), (err.count(), q))
    t99 = sum(PRIX[x["sku"]] * x["quantity"] for x in panier_stocke(pg)["lignes"])
    check("après les essais, le total reflète la quantité enregistrée (1)", norm(fmt(t99)) in txt(pg, ".totaux"))
    # retrait d'une ligne puis rechargement : conservé dans l'onglet
    c.agir(pg.get_by_role("button", name=f"Retirer du panier : {MODELE['tap-01']['nom']}", exact=False).first)
    check("retrait : la ligne disparaît (3 restantes)", pg.locator(".ligne-panier").count() == 3)
    pg.reload()
    pg.wait_for_selector(".ligne-panier")
    check("rechargement : le panier survit dans l'onglet (3 lignes)", pg.locator(".ligne-panier").count() == 3)
    # vider : annulation puis confirmation
    c.agir(pg.get_by_role("button", name="Vider le panier"))
    check("vider : demande de confirmation annonçant la conséquence", "Aucune autre donnée du navigateur" in txt(pg, ".vidage"))
    c.agir(pg.get_by_role("button", name="Annuler"))
    check("annuler : panier intact", pg.locator(".ligne-panier").count() == 3)
    c.agir(pg.get_by_role("button", name="Vider le panier"))
    c.agir(pg.get_by_role("button", name="Oui, vider le panier"))
    check("panier vidé : état vide explicatif avec renvoi au catalogue", "Votre panier est vide" in txt(pg) and pg.get_by_role("link", name="Voir le catalogue").count() >= 1)
    s = stock(pg)
    check("panier vidé dans la clé d'état unique : donnée étrangère intacte, aucune autre clé", panier_stocke(pg) is None and set(s) == {CLE_ETAT, ETR} and s.get(ETR) == "ne pas toucher", s)

    # --- 3. Nouveau panier : 2 × SKU A + 1 × SKU B, puis commande
    for _ in range(2):
        ajouter_depuis_fiche(c, pg, "sup-03", "04", _ + 1)
    ajouter_depuis_fiche(c, pg, "lum-01", "02", 1)
    pg.goto(BASE + "/panier.html")
    pg.wait_for_selector(".ligne-panier")
    prod = 2 * PRIX[a] + PRIX[b_]
    c.agir(pg.get_by_role("link", name="Passer au récapitulatif de la commande"))
    pg.wait_for_selector("#terminer")
    sans_debordement(pg, "commande")
    check("commande : Standard sélectionné par défaut", pg.is_checked("#livraison-standard") and not pg.is_checked("#livraison-express"))
    tt = txt(pg, "#totaux")
    check(f"Standard : Produits {fmt(prod)} + Livraison 4,90 € = {fmt(prod + 490)}",
          norm(fmt(prod)) in tt and "4,90 €" in tt and norm(fmt(prod + 490)) in tt and "Total de la simulation" in tt, tt)
    c.agir(pg.locator('label[for="livraison-express"]'))
    tt = txt(pg, "#totaux")
    check(f"Express : Livraison 9,90 € et total {fmt(prod + 990)} (écart de 5,00 €)", "9,90 €" in tt and norm(fmt(prod + 990)) in tt and (prod + 990) - (prod + 490) == 500, tt)
    pg.wait_for_function("document.getElementById('statut').textContent.includes('Express')")
    check("changement de livraison annoncé dans la zone de statut", "Express" in txt(pg, "#statut"), txt(pg, "#statut"))
    check("rappel adjacent : aucune commande envoyée, aucun paiement", "Aucune commande ne sera envoyée et aucun paiement ne sera effectué." in txt(pg, ".validation"))
    check("aucun champ personnel ni de paiement sur la commande", pg.locator("input[type=text], input[type=email], input[type=tel], input[type=password], textarea, [autocomplete]").count() == 0)
    dans_ecran(pg, pg.locator("#terminer"), "bouton « Terminer la simulation »")
    # correction du panier puis retour : recalcul depuis le panier, Standard de nouveau par défaut
    c.agir(pg.get_by_role("link", name="Modifier le panier"))
    pg.wait_for_selector(".ligne-panier")
    pg.evaluate("([id, v]) => { const i = document.getElementById(id); i.value = v; i.dispatchEvent(new Event('change', {bubbles: true})); }", [f"qte-{b_}", "3"])
    prod = 2 * PRIX[a] + 3 * PRIX[b_]
    c.agir(pg.get_by_role("link", name="Passer au récapitulatif de la commande"))
    pg.wait_for_selector("#terminer")
    tt = txt(pg, "#totaux")
    check(f"retour au récapitulatif : recalculé depuis le panier ({fmt(prod + 490)}), Standard par défaut", pg.is_checked("#livraison-standard") and norm(fmt(prod + 490)) in tt, tt)

    # --- 4. Terminer : double activation, une seule simulation
    pg.evaluate("window.name = '[]'")
    c.agir(pg.locator('label[for="livraison-express"]'))
    # double activation rapide, dans le même instant : seule la première doit compter
    pg.evaluate("() => { const b = document.getElementById('terminer'); b.click(); b.click(); b.click(); }")
    pg.wait_for_url("**/confirmation.html")
    pg.wait_for_selector(".etat--succes")
    ecritures = [k for k in json.loads(pg.evaluate("window.name") or "[]") if k == CLE_ETAT]
    check("double activation : une seule écriture d'état (capture + panier vide en une fois)", len(ecritures) == 1, ecritures)
    t = txt(pg)
    check("confirmation : « Simulation terminée. Aucune commande n'a été envoyée et aucun paiement n'a été effectué. »",
          "Simulation terminée. Aucune commande n’a été envoyée et aucun paiement n’a été effectué." in t, t[:300])
    attendu_total = prod + 990
    check(f"confirmation : récapitulatif figé (Express, produits {fmt(prod)}, total {fmt(attendu_total)}), SKU et quantités",
          norm(fmt(attendu_total)) in t and norm(fmt(prod)) in t and "9,90 €" in t and a in t and b_ in t and f"3 × {norm(fmt(PRIX[b_]))}" in t, t)
    check("confirmation : ni numéro de commande, ni facture, ni e-mail, ni statut d'expédition",
          not any(x in t.replace("Il n’a ni numéro de commande, ni facture, ni statut d’expédition.", "").lower() for x in ["numéro de commande", "facture", "e-mail de confirmation", "expédi", "en cours de livraison"]))
    s = stock(pg)
    check("stockage après succès : une seule clé Ligne Posée, panier vide et capture présente dans la même écriture, donnée étrangère intacte",
          set(s) == {CLE_ETAT, ETR} and etat_stocke(pg)["lignes"] == [] and conf_stockee(pg) is not None, sorted(s))
    sans_debordement(pg, "confirmation")
    avant = conf_stockee(pg)
    pg.reload()
    pg.wait_for_selector(".etat--succes")
    check("rechargement de la confirmation : même récapitulatif, aucune seconde opération",
          conf_stockee(pg) == avant and len([k for k in json.loads(pg.evaluate("window.name") or "[]") if k == CLE_ETAT]) == 1)
    pg.go_back()
    pg.wait_for_selector("#commande-zone .etat, #terminer")
    t = txt(pg)
    check("Retour navigateur vers la commande : panier vide, aucun bouton pour reconfirmer",
          "Votre panier est vide" in t and pg.locator("#terminer").count() == 0, t[:200])
    pg.go_forward()
    pg.wait_for_selector(".etat--succes")
    check("Avancer : la confirmation figée est inchangée", conf_stockee(pg) == avant)
    # arrivée directe dans un autre onglet (autre session) : aucun succès
    autre = c.ctx.browser.new_context(viewport={"width": w, "height": 800})
    p2 = autre.new_page()
    p2.goto(BASE + "/confirmation.html")
    p2.wait_for_selector("#confirmation-zone .etat")
    t2 = txt(p2)
    check("arrivée directe sans capture : « Aucune simulation terminée dans cet onglet », jamais de succès",
          "Aucune simulation terminée dans cet onglet" in t2 and "Simulation terminée." not in t2.replace("Aucune simulation terminée", ""), t2[:200])
    autre.close()

    # --- 5. Requêtes, stockage, erreurs
    hors = [(m, u) for (m, u) in c.requetes if m != "GET" or not u.startswith(BASE)]
    check("aucune requête hors GET du site lui-même (pas de POST, pas de domaine externe)", not hors, hors[:5])
    chemins = sorted({urllib.parse.urlparse(u).path for (_, u) in c.requetes})
    check("requêtes limitées aux fichiers du site", all(p.endswith((".html", ".css", ".js", ".json", ".svg", ".ico")) or p == "/" for p in chemins), chemins)
    check("aucune erreur JavaScript non gérée sur tout le parcours", not c.erreurs, c.erreurs[:3])
    ls = pg.evaluate("localStorage.length")
    ck = pg.evaluate("document.cookie")
    check("localStorage vide, aucun cookie", ls == 0 and ck == "", (ls, ck))
    c.ctx.close()


def parcours_clavier(b, w):
    print(f"\n=== Parcours au clavier seul à {w} px", flush=True)
    c = Contexte(b, w)
    pg = c.page()

    def tab_vers(js, maxi=90):
        for _ in range(maxi):
            pg.keyboard.press("Tab")
            if pg.evaluate(js):
                return True
        return False

    pg.goto(f"{BASE}/produit.html?modele=sup-03&variante=04")
    pg.wait_for_selector("#ajouter")
    check("clavier : le bouton « Ajouter au panier » est atteignable par Tab", tab_vers("document.activeElement.id === 'ajouter'"))
    pg.keyboard.press("Enter")
    check("clavier : Entrée ajoute la variante affichée", panier_stocke(pg) == {"v": 1, "lignes": [{"sku": SKU_A, "quantity": 1}]}, panier_stocke(pg))
    check("clavier : le lien « Voir le panier » est le suivant dans l'ordre de tabulation", tab_vers("document.activeElement.textContent.trim() === 'Voir le panier'", 3))
    pg.keyboard.press("Enter")
    pg.wait_for_url("**/panier.html")
    pg.wait_for_selector(".ligne-panier")
    check("clavier : champ de quantité atteignable", tab_vers("document.activeElement.id === 'qte-" + SKU_A + "'"))
    pg.keyboard.press("Control+A")
    pg.keyboard.type("3")
    pg.keyboard.press("Tab")
    check("clavier : quantité 3 enregistrée par saisie + Tab", panier_stocke(pg)["lignes"][0]["quantity"] == 3, panier_stocke(pg))
    check("clavier : total recalculé", norm(fmt(PRIX[SKU_A] * 3)) in txt(pg, ".totaux"))
    check("clavier : lien vers le récapitulatif atteignable", tab_vers("document.activeElement.textContent.trim().startsWith('Passer au récapitulatif')", 12))
    pg.keyboard.press("Enter")
    pg.wait_for_url("**/commande.html")
    pg.wait_for_selector("#terminer")
    check("clavier : groupe de livraison atteignable (Standard coché)", tab_vers("document.activeElement.name === 'livraison'", 30) and pg.evaluate("document.activeElement.value") == "standard")
    pg.keyboard.press("ArrowDown")
    check("clavier : flèche bas choisit Express et recalcule", pg.is_checked("#livraison-express") and norm(fmt(PRIX[SKU_A] * 3 + 990)) in txt(pg, "#totaux"))
    check("clavier : bouton « Terminer la simulation » atteignable", tab_vers("document.activeElement.id === 'terminer'", 8))
    pg.keyboard.press("Space")
    pg.wait_for_url("**/confirmation.html")
    pg.wait_for_selector(".etat--succes")
    check("clavier : simulation terminée avec le total Express", norm(fmt(PRIX[SKU_A] * 3 + 990)) in txt(pg))
    c.ctx.close()


def pannes(b, w):
    print(f"\n=== Pannes et états invalides à {w} px", flush=True)

    def neuf(init=None, **kw):
        c = Contexte(b, w, **kw)
        if init:
            c.ctx.add_init_script(init)
        return c, c.page()

    def cart(lignes):
        return "if(!sessionStorage.getItem('%s'))sessionStorage.setItem('%s',%s);" % (CLE_ETAT, CLE_ETAT, json.dumps(etat_json(lignes)))

    valide = [{"sku": SKU_A, "quantity": 2}, {"sku": SKU_B, "quantity": 1}]

    # 1. Stockage refusé
    c, pg = neuf("Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('refusé','SecurityError')}})")
    pg.goto(f"{BASE}/produit.html?modele=sup-03&variante=04")
    pg.wait_for_selector("#ajouter")
    check("stockage refusé : « Ajouter au panier » désactivé avec explication, prix et références restent visibles",
          pg.locator("#ajouter").is_disabled() and "indisponible ou refusé" in txt(pg) and "169,00" not in txt(pg) and "169 €" in txt(pg), txt(pg)[:300])
    for page, attendu in [("panier.html", "Panier indisponible dans ce navigateur"), ("commande.html", "Commande simulée indisponible"), ("confirmation.html", "Aucune simulation terminée dans cet onglet")]:
        pg.goto(f"{BASE}/{page}")
        pg.wait_for_selector("#panier-zone .etat, #commande-zone .etat, #confirmation-zone .etat")
        pg.wait_for_timeout(150)
        t = txt(pg)
        check(f"stockage refusé : {page} → « {attendu} », aucun succès ni total", attendu in t and "Simulation terminée." not in t.replace("Aucune simulation terminée", "") and "Total de la simulation" not in t, t[:200])
    pg.goto(f"{BASE}/catalogue.html")
    pg.wait_for_selector("#cartes .carte")
    check("stockage refusé : le catalogue reste consultable (20 modèles)", pg.locator("#cartes .carte").count() == 20)
    check("stockage refusé : aucune exception JavaScript", not c.erreurs, c.erreurs[:2])
    c.ctx.close()

    # 2. Écriture refusée à l'ajout
    c, pg = neuf("Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError')}")
    pg.goto(f"{BASE}/produit.html?modele=sup-03&variante=04")
    pg.wait_for_selector("#ajouter")
    c.agir(pg.locator("#ajouter"))
    t = txt(pg, "#achat-retour")
    check("écriture refusée à l'ajout : erreur visible, aucune réussite, panier inchangé",
          "a échoué" in t and "Ajouté" not in t and panier_stocke(pg) is None and pg.get_by_role("link", name="Voir le panier").count() == 0, t)
    c.ctx.close()

    # 3. Panier illisible
    c, pg = neuf(ETRANGER + ";sessionStorage.setItem('%s','{pas du json')" % CLE_ETAT)
    pg.goto(BASE + "/panier.html")
    pg.wait_for_selector("#panier-zone .etat")
    pg.wait_for_selector("text=illisible")
    check("panier illisible : avis visible, aucun total, option de repartir d'un panier vide", "Repartir d’un panier vide" in txt(pg) and "Total" not in txt(pg))
    pg.goto(f"{BASE}/produit.html?modele=sup-03&variante=04")
    pg.wait_for_selector("#ajouter")
    c.agir(pg.locator("#ajouter"))
    check("panier illisible : l'ajout est refusé avec renvoi vers le panier, rien n'est écrasé",
          "illisible" in txt(pg, "#achat-retour") and stock(pg).get(CLE_ETAT) == "{pas du json", txt(pg, "#achat-retour"))
    pg.goto(BASE + "/commande.html")
    pg.wait_for_selector("text=illisible")
    check("panier illisible : pas de récapitulatif ni de bouton de validation", pg.locator("#terminer").count() == 0)
    pg.goto(BASE + "/panier.html")
    c.agir(pg.get_by_role("button", name="Repartir d’un panier vide"))
    s = stock(pg)
    check("réparation explicite : seul l'état de Ligne Posée est remplacé par un panier vide, donnée étrangère intacte", panier_stocke(pg) is None and etat_stocke(pg) is not None and s.get(ETR) == "ne pas toucher" and "Votre panier est vide" in txt(pg), s)
    c.ctx.close()

    # 4. Lignes invalides : quantité hors plage, SKU disparu
    lignes = [{"sku": SKU_A, "quantity": 2}, {"sku": SKU_B, "quantity": 500}, {"sku": "LP-SUP-09-09", "quantity": 1}, {"sku": "LP-TAP-01-01", "quantity": 1.5}]
    c, pg = neuf(cart(lignes))
    pg.goto(BASE + "/panier.html")
    pg.wait_for_selector(".liste-problemes")
    t = txt(pg)
    check("lignes invalides : avis listant chaque problème, ligne valide seule affichée, aucun total, pas de lien vers la commande",
          "LP-SUP-09-09" in t and "référence absente du catalogue" in t and "quantité invalide" in t and pg.locator(".ligne-panier").count() == 1
          and "Total des produits" not in t and pg.get_by_role("link", name="Passer au récapitulatif de la commande").count() == 0, t[:400])
    pg.goto(BASE + "/commande.html")
    pg.wait_for_selector("text=ne peuvent pas être vérifiées")
    check("lignes invalides : la commande ne propose ni total ni validation", pg.locator("#terminer").count() == 0 and "Total de la simulation" not in txt(pg))
    pg.goto(BASE + "/panier.html")
    pg.wait_for_selector(".liste-problemes")
    c.agir(pg.get_by_role("button", name="Écarter les lignes invalides"))
    check("écarter : lignes revérifiées, seule la ligne valide demeure à l'identique, total présent, rien de substitué",
          panier_stocke(pg) == {"v": 1, "lignes": [{"sku": SKU_A, "quantity": 2}]} and norm(fmt(2 * PRIX[SKU_A])) in txt(pg, ".totaux") and pg.locator(".liste-problemes").count() == 0, panier_stocke(pg))
    c.ctx.close()

    # 5. Catalogue invalide / inaccessible
    pannes_cat = {
        "prix modifié d'un centime": lambda r: r.fulfill(status=200, content_type="application/json", body=json.dumps({**CAT, "references": [{**x, "prixCents": x["prixCents"] + 1} if x["sku"] == SKU_A else x for x in CAT["references"]]})),
        "id de modèle {\"toString\":null}": lambda r: r.fulfill(status=200, content_type="application/json", body=json.dumps({**CAT, "modeles": [{**CAT["modeles"][0], "id": {"toString": None}}] + CAT["modeles"][1:]})),
        "HTTP 500": lambda r: r.fulfill(status=500, body="erreur"),
        "requête avortée": lambda r: r.abort(),
        "JSON illisible": lambda r: r.fulfill(status=200, content_type="application/json", body="{pas du json"),
    }
    for nom, handler in pannes_cat.items():
        c, pg = neuf(cart(valide))
        pg.route("**/data/catalogue.json", lambda route, req, h=handler: h(route))
        pg.goto(BASE + "/panier.html")
        pg.wait_for_selector("text=n’a pas pu être vérifié")
        t = txt(pg)
        check(f"catalogue invalide ({nom}) : panier indisponible, aucun prix ni total, panier non modifié",
              "€" not in t and "Total" not in t and panier_stocke(pg) == {"v": 1, "lignes": valide}, t[:300])
        pg.goto(BASE + "/commande.html")
        pg.wait_for_selector("text=n’a pas pu être vérifié")
        t = txt(pg)
        check(f"catalogue invalide ({nom}) : commande sans total ni bouton de validation, pas d'exception", "€" not in t.replace("4,90 €", "") and pg.locator("#terminer").count() == 0 and not c.erreurs, t[:200])
        pg.goto(f"{BASE}/produit.html?modele=sup-03&variante=04")
        pg.wait_for_selector("#fiche-repli-indispo:not([hidden])")
        check(f"catalogue invalide ({nom}) : fiche indisponible, aucun bouton d'ajout", pg.locator("#ajouter").count() == 0)
        c.ctx.close()

    # 6. L2-01 — pannes de stockage à la finalisation : aucune page de succès après un échec annoncé,
    #    confirmation antérieure préservée, accès direct / rechargement sans nouvelle confirmation, retry sans doublon.
    def panne_js(set_cle=None, remove_cles=None):
        """Patch Storage.prototype : setItem refusé pour `set_cle`, removeItem refusé pour `remove_cles` ('*' = tout) tant que window.__panne."""
        morceaux = ["window.__panne=true"]
        if set_cle:
            morceaux.append("const os=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.__panne&&k==='%s')throw new DOMException('quota','QuotaExceededError');return os.call(this,k,v)}" % set_cle)
        if remove_cles:
            morceaux.append("const orm=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){if(window.__panne&&(%s))throw new DOMException('refus','SecurityError');return orm.call(this,k)}" % " || ".join(f"k==='{k}'" for k in remove_cles))
        return ";".join(morceaux)

    ancienne = capture_ancienne()
    total_ancien = norm(fmt(ancienne["totalCents"]))
    prod = 2 * PRIX[SKU_A] + PRIX[SKU_B]
    total_nouveau = norm(fmt(prod + 490))
    pannes_fin = {
        "quota sur l'écriture de l'état": dict(js=panne_js(set_cle=CLE_ETAT), echec=True),
        "toutes suppressions refusées + écriture de l'état refusée": dict(js=panne_js(set_cle=CLE_ETAT, remove_cles=[CLE_ETAT, CLE_PANIER_V1, CLE_CONF_V1]), echec=True),
        "suppression de l'état refusée seule": dict(js=panne_js(remove_cles=[CLE_ETAT]), echec=False),
        "suppression de l'ancien panier refusée seule": dict(js=panne_js(remove_cles=[CLE_PANIER_V1]), echec=False),
        "suppression de l'ancienne confirmation refusée seule": dict(js=panne_js(remove_cles=[CLE_CONF_V1]), echec=False),
        "refus combiné des trois suppressions": dict(js=panne_js(remove_cles=[CLE_ETAT, CLE_PANIER_V1, CLE_CONF_V1]), echec=False),
    }
    for avec_ancienne in (True, False):
        for nom, cfg in pannes_fin.items():
            lib = f"{nom} ({'avec' if avec_ancienne else 'sans'} confirmation antérieure)"
            if avec_ancienne:
                graine = "if(!sessionStorage.getItem('%s'))sessionStorage.setItem('%s',%s);" % (CLE_ETAT, CLE_ETAT, json.dumps(etat_json(valide, ancienne)))
            else:
                graine = cart(valide)
            c, pg = neuf(ETRANGER + ";" + graine + ";" + cfg["js"])
            pg.goto(BASE + "/commande.html")
            pg.wait_for_selector("#terminer")
            avant_brut = stock(pg).get(CLE_ETAT)
            c.agir(pg.locator("#terminer"))
            if cfg["echec"]:
                pg.wait_for_selector("#erreur-terminer .etat--alerte")
                s = stock(pg)
                check(f"{lib} : pas de page de succès, erreur visible, bouton réactivé",
                      pg.url.endswith("/commande.html") and "La simulation n’a pas été terminée" in txt(pg) and pg.locator("#terminer").is_enabled(), (pg.url, sorted(s)))
                check(f"{lib} : état stocké strictement inchangé (panier et confirmation antérieure)", s.get(CLE_ETAT) == avant_brut and s.get(ETR) == "ne pas toucher", sorted(s))
                # accès direct et rechargement de la confirmation APRÈS l'échec annoncé
                for acces in ("accès direct", "rechargement"):
                    if acces == "accès direct":
                        pg.goto(BASE + "/confirmation.html")
                    else:
                        pg.reload()
                    pg.wait_for_selector("#confirmation-zone .etat, #confirmation-zone .etat--succes")
                    t = txt(pg)
                    if avec_ancienne:
                        check(f"{lib} : {acces} → seule la confirmation ANTÉRIEURE ({fmt(ancienne['totalCents'])}), jamais la nouvelle ({fmt(prod + 490)})",
                              total_ancien in t and total_nouveau not in t and "Ancien modèle" in t, t[:300])
                    else:
                        check(f"{lib} : {acces} → aucune page de succès",
                              "Aucune simulation terminée dans cet onglet" in t and "Simulation terminée." not in t.replace("Aucune simulation terminée", "") and total_nouveau not in t, t[:300])
                pg.goto(BASE + "/panier.html")
                pg.wait_for_selector(".ligne-panier")
                check(f"{lib} : panier cohérent (2 lignes) après l'échec", pg.locator(".ligne-panier").count() == 2 and norm(fmt(prod)) in txt(pg, ".totaux"), txt(pg)[:200])
                pg.goto(BASE + "/commande.html")
                pg.wait_for_selector("#terminer")
                pg.evaluate("window.__panne=false")  # après le chargement : les scripts d'initialisation le rétabliraient
                pg.evaluate("window.name = '[]'")
                c.agir(pg.locator("#terminer"))
            else:
                pg.wait_for_url("**/confirmation.html")
            pg.wait_for_selector(".etat--succes")
            t = txt(pg)
            s = stock(pg)
            e = etat_stocke(pg)
            check(f"{lib} : succès unique, nouvelle confirmation ({fmt(prod + 490)}), panier vide, une seule clé Ligne Posée active",
                  total_nouveau in t and e["lignes"] == [] and e["confirmation"]["totalCents"] == prod + 490 and s.get(ETR) == "ne pas toucher", (t[:200], s.keys()))
            if not cfg["echec"]:
                pg.reload()
                pg.wait_for_selector(".etat--succes")
                pg.goto(BASE + "/panier.html")
                pg.wait_for_selector("#panier-zone .etat")
                check(f"{lib} : rechargements → toujours cohérent, panier vide sans ressusciter, pas de seconde simulation",
                      "Votre panier est vide" in txt(pg) and total_nouveau not in txt(pg), txt(pg)[:150])
            else:
                check(f"{lib} : nouvelle tentative = une seule écriture d'état",
                      json.loads(pg.evaluate("window.name") or "[]").count(CLE_ETAT) == 1, pg.evaluate("window.name"))
            check(f"{lib} : aucune exception JavaScript non gérée", not c.erreurs, c.erreurs[:2])
            c.ctx.close()

    # 6 bis. L2-01 — migration depuis l'ancien état à deux clés : lecture, puis état unique après la première écriture.
    c, pg = neuf(ETRANGER + ";if(!sessionStorage.getItem('%s')&&!sessionStorage.getItem('%s')){sessionStorage.setItem('%s',%s);sessionStorage.setItem('%s',%s)}" % (
        CLE_ETAT, CLE_PANIER_V1, CLE_PANIER_V1, json.dumps(json.dumps({"v": 1, "lignes": valide})), CLE_CONF_V1, json.dumps(json.dumps(ancienne))))
    pg.goto(BASE + "/panier.html")
    pg.wait_for_selector(".ligne-panier")
    check("ancien état à deux clés : le panier existant est lu (repli), 2 lignes, aucune écriture par la simple lecture",
          pg.locator(".ligne-panier").count() == 2 and CLE_ETAT not in stock(pg), sorted(stock(pg)))
    pg.goto(BASE + "/confirmation.html")
    pg.wait_for_selector("#confirmation-zone .etat--succes")
    check("ancien état à deux clés : l'ancienne confirmation reste lisible", total_ancien in txt(pg), txt(pg)[:200])
    pg.goto(BASE + "/commande.html")
    pg.wait_for_selector("#terminer")
    c.agir(pg.locator("#terminer"))
    pg.wait_for_url("**/confirmation.html")
    pg.wait_for_selector(".etat--succes")
    s = stock(pg)
    check("migration à la première écriture : clé unique v2, anciennes clés retirées, nouvelle confirmation, donnée étrangère intacte",
          set(s) == {CLE_ETAT, ETR} and total_nouveau in txt(pg) and etat_stocke(pg)["lignes"] == [], sorted(s))
    c.ctx.close()

    # 6 ter. L2-02 — capture corrompue à Number.MAX_SAFE_INTEGER : état explicatif, aucune exception, aucun succès
    M = 2 ** 53 - 1
    corrompues = {
        "total au-delà de MAX_SAFE_INTEGER": {"v": 1, "lignes": [{"sku": SKU_A, "modele": "Modèle", "finition": "F", "prixCents": M, "quantite": 1, "sousTotalCents": M}],
                                              "livraison": {"id": "standard", "libelle": "Standard", "cents": 490}, "produitsCents": M, "totalCents": M + 490},
        "sous-total à 2^53": {"v": 1, "lignes": [{"sku": SKU_A, "modele": "Modèle", "finition": "F", "prixCents": 2 ** 52, "quantite": 2, "sousTotalCents": 2 ** 53}],
                              "livraison": {"id": "standard", "libelle": "Standard", "cents": 490}, "produitsCents": 2 ** 53, "totalCents": 2 ** 53 + 490},
    }
    for nom, cap in corrompues.items():
        c, pg = neuf("sessionStorage.setItem('%s',%s)" % (CLE_ETAT, json.dumps(etat_json([], cap))))
        pg.goto(BASE + "/confirmation.html")
        pg.wait_for_selector("#confirmation-zone .etat")
        t = txt(pg)
        check(f"capture corrompue ({nom}) : état explicatif « illisible ou incohérent », aucun succès, aucun montant, pas d'exception",
              "Aucune simulation terminée dans cet onglet" in t and "illisible ou incohérent" in t and "Simulation terminée." not in t.replace("Aucune simulation terminée", "") and "Total" not in t and "€" not in t and not c.erreurs,
              (t[:250], c.erreurs[:2]))
        sans_debordement(pg, f"confirmation corrompue ({nom})")
        c.ctx.close()
    # défense en profondeur : si le formatage lève malgré une capture jugée valide, repli explicatif (aucun succès partiel)
    src_ui = open(os.path.join(RACINE, "js/panier-ui.js"), encoding="utf-8").read()
    casse = src_ui.replace("export function totaux(", "export function totaux() { throw new RangeError('simulé'); }\nexport function _totauxOrigine(")
    assert casse != src_ui
    c, pg = neuf("sessionStorage.setItem('%s',%s)" % (CLE_ETAT, json.dumps(etat_json([], ancienne))))
    pg.route("**/js/panier-ui.js", lambda route, req: route.fulfill(status=200, content_type="text/javascript; charset=utf-8", body=casse))
    pg.goto(BASE + "/confirmation.html")
    pg.wait_for_selector("#confirmation-zone .etat")
    t = txt(pg)
    check("rendu qui lève : repli explicatif, jamais de succès partiel ni de montant, pas d'exception non gérée",
          "Aucune simulation terminée dans cet onglet" in t and "Simulation terminée." not in t.replace("Aucune simulation terminée", "") and "€" not in t and not c.erreurs, (t[:250], c.erreurs[:2]))
    c.ctx.close()

    # 7. Sans JavaScript
    ctx = b.new_context(viewport={"width": w, "height": 800}, java_script_enabled=False)
    pg = ctx.new_page()
    for page in ["panier.html", "commande.html", "confirmation.html"]:
        pg.goto(f"{BASE}/{page}")
        t = txt(pg)
        check(f"sans JavaScript : {page} lisible, explique l'indisponibilité, aucune action ni faux succès",
              ("a besoin de JavaScript" in t or "Aucune simulation n’est affichée" in t) and pg.locator("main button, main form, main input").count() == 0 and "Simulation terminée." not in t, t[:200])
        sans_debordement(pg, f"sans JavaScript, {page}")
        pg.get_by_role("link", name="Retour à l’accueil").first.click() if page != "commande.html" else pg.get_by_role("link", name="Retour au catalogue").first.click()
        check(f"sans JavaScript : navigation de repli depuis {page}", pg.url.endswith(("index.html", "catalogue.html")), pg.url)
    ctx.close()


def mise_en_page(b, w):
    print(f"\n=== Mise en page à {w} px (panier chargé, 99 × plus longs libellés)", flush=True)
    c = Contexte(b, w)
    pg = c.page()
    plein = [{"sku": r["sku"], "quantity": 99} for r in CAT["references"][:12]]
    pg.goto(BASE + "/index.html")
    pg.evaluate("([k, v]) => sessionStorage.setItem(k, v)", [CLE_ETAT, etat_json(plein)])
    for page in ["panier.html", "commande.html"]:
        pg.goto(f"{BASE}/{page}")
        pg.wait_for_selector(".ligne-panier, #terminer")
        sans_debordement(pg, f"{page} avec 12 lignes à 99")
    t = txt(pg, "#totaux")
    total = sum(PRIX[x["sku"]] * 99 for x in plein)
    check(f"12 lignes × 99 : total exact {fmt(total + 490)}", norm(fmt(total + 490)) in t, t)
    dans_ecran(pg, pg.locator("#terminer"), "« Terminer la simulation » avec 12 lignes")
    c.ctx.close()


def retrait_clavier(b, w):
    print(f"\n=== Retrait au clavier à {w} px", flush=True)
    c = Contexte(b, w)
    pg = c.page()
    pg.goto(BASE + "/index.html")
    pg.evaluate("([k, v]) => sessionStorage.setItem(k, v)", [CLE_ETAT, etat_json([{"sku": SKU_A, "quantity": 1}, {"sku": SKU_B, "quantity": 1}])])
    pg.goto(BASE + "/panier.html")
    pg.wait_for_selector(".ligne-panier")
    ok = False
    for _ in range(40):
        pg.keyboard.press("Tab")
        if pg.evaluate("document.activeElement.tagName === 'BUTTON' && document.activeElement.textContent === 'Retirer'"):
            ok = True
            break
    check("clavier : bouton « Retirer » atteignable", ok)
    nom = pg.evaluate("document.activeElement.getAttribute('aria-label')")
    pg.keyboard.press("Enter")
    SONDE = """(() => { const e = document.activeElement; const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
      return { id: e.id, tag: e.tagName, texte: e.textContent.trim().slice(0, 60), visibleFocus: e.matches(':focus-visible'), style: cs.outlineStyle,
               largeur: parseFloat(cs.outlineWidth), couleur: cs.outlineColor, dansPage: r.width > 0 && r.height > 0, estZone: e.id === 'panier-zone' } })()"""
    check("clavier : Entrée retire la ligne, une ligne reste", pg.locator(".ligne-panier").count() == 1 and nom.startswith("Retirer du panier"), nom)
    f1 = pg.evaluate(SONDE)
    check("L2-03 panier NON vide après retrait : le focus est sur le titre « Contenu du panier », nœud qui survit, pas sur le conteneur",
          f1["id"] == "panier-focus" and f1["tag"] == "H2" and "Contenu du panier" in f1["texte"] and not f1["estZone"] and f1["dansPage"], f1)
    check("L2-03 panier non vide : anneau de focus VISIBLE (:focus-visible, trait plein ≥ 2 px, couleur non transparente)",
          f1["visibleFocus"] and f1["style"] not in ("none", "hidden") and f1["largeur"] >= 2 and f1["couleur"] not in ("transparent", "rgba(0, 0, 0, 0)"), f1)
    pg.wait_for_function("document.getElementById('statut').textContent.startsWith('Retiré du panier')")
    check("retrait annoncé dans la zone de statut", "Retiré du panier" in txt(pg, "#statut"))
    # on continue au clavier : Tab doit repartir de là vers « Retirer » de la ligne restante
    ok = False
    for _ in range(12):
        pg.keyboard.press("Tab")
        if pg.evaluate("document.activeElement.tagName === 'BUTTON' && document.activeElement.textContent === 'Retirer'"):
            ok = True
            break
    check("L2-03 : l'ordre de tabulation reste utilisable après le retrait (le bouton « Retirer » restant est atteignable)", ok)
    pg.keyboard.press("Enter")
    pg.wait_for_selector("text=Votre panier est vide")
    f2 = pg.evaluate(SONDE)
    check("L2-03 panier VIDE après retrait : le focus est sur le bloc d'état « Votre panier est vide » (ne disparaît pas), pas sur le conteneur",
          f2["id"] == "panier-focus" and "Votre panier est vide" in f2["texte"] and not f2["estZone"] and f2["dansPage"], f2)
    check("L2-03 panier vide : anneau de focus VISIBLE (:focus-visible, trait plein ≥ 2 px, couleur non transparente)",
          f2["visibleFocus"] and f2["style"] not in ("none", "hidden") and f2["largeur"] >= 2 and f2["couleur"] not in ("transparent", "rgba(0, 0, 0, 0)"), f2)
    ecran = pg.evaluate("(() => { const r = document.activeElement.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth })()")
    check("L2-03 panier vide : l'élément focalisé est dans l'écran", ecran)
    check("L2-03 : l'état vide est conservé après le retrait de la dernière ligne (stockage)", panier_stocke(pg) is None and etat_stocke(pg)["lignes"] == [])
    c.ctx.close()


OBS_CLS = "window.__s=[];new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput) window.__s.push(e.value)}).observe({type:'layout-shift',buffered:true});"
SNAP = """(() => { const f = document.querySelector('.site-footer'); const l = document.querySelector('.suite-page');
  return { foot: Math.round(f.getBoundingClientRect().top + scrollY), vf: getComputedStyle(f).visibility, vl: getComputedStyle(l).visibility,
           classe: document.documentElement.classList.contains('page-attente'), repli: document.documentElement.hasAttribute('data-page-repli') } })()"""
SEED = [{"sku": SKU_A, "quantity": 2}, {"sku": SKU_B, "quantity": 1}, {"sku": "LP-TAP-05-03", "quantity": 12}]


def stabilite(b, w):
    print(f"\n=== Stabilité de mise en page et module en retard à {w} px", flush=True)
    for page, module, zone in [("panier.html", "page-panier.js", "#panier-zone"), ("commande.html", "page-commande.js", "#commande-zone")]:
        seed = "sessionStorage.setItem('%s', %s);" % (CLE_ETAT, json.dumps(etat_json(SEED)))
        # 1. chargement normal, puis catalogue.json retardé de 3 s (routes retenues puis libérées)
        for retard in (0, 3000):
            c = Contexte(b, w)
            c.ctx.add_init_script(OBS_CLS + seed)
            pg = c.page()
            tenues = []
            if retard:
                pg.route("**/data/catalogue.json", lambda route, req: tenues.append(route))
            pg.goto(f"{BASE}/{page}", wait_until="commit")
            if retard:
                pg.wait_for_timeout(retard)
                a = pg.evaluate(SNAP)
                check(f"{page} catalogue retardé de {retard // 1000} s : liens et pied invisibles pendant l'attente, message « Chargement » affiché",
                      a["vf"] == "hidden" and a["vl"] == "hidden" and "Chargement" in txt(pg), a)
                for r in tenues:
                    r.continue_()
            pg.wait_for_selector(f"{zone} .ligne-panier, {zone} .recap, #terminer")
            pg.wait_for_timeout(300)
            z = pg.evaluate(SNAP)
            cls = round(sum(pg.evaluate("__s")), 4)
            check(f"{page} {'catalogue retardé de 3 s' if retard else 'chargement normal'} : CLS = {cls} (≤ 0,1), pied et liens visibles ensuite", cls <= 0.1 and z["vf"] == "visible" and z["vl"] == "visible" and not z["classe"], (cls, z))
            c.ctx.close()
        # 2. module qui échoue immédiatement : repli statique, liens libérés sans attendre
        c = Contexte(b, w)
        pg = c.page()
        pg.route(f"**/js/{module}", lambda route, req: route.abort())
        pg.goto(f"{BASE}/{page}", wait_until="load")
        pg.wait_for_timeout(200)
        z = pg.evaluate(SNAP)
        check(f"{page} module en échec : repli statique affiché, liens et pied visibles sans attente", z["vf"] == "visible" and z["vl"] == "visible" and "JavaScript" in txt(pg), z)
        c.ctx.close()
        # 3. module pendant : repli à 2 s, puis arrivée tardive sans aucun changement
        c = Contexte(b, w)
        pg = c.page()
        tenues = []
        pg.route(f"**/js/{module}", lambda route, req: tenues.append(route))
        pg.add_init_script("window.__t0 = performance.now(); window.__mut = 0; document.addEventListener('DOMContentLoaded', () => new MutationObserver(m => { window.__mut += m.length }).observe(document.querySelector('main'), {subtree: true, childList: true, attributes: true, characterData: true}))")
        pg.goto(f"{BASE}/{page}", wait_until="commit")
        pg.wait_for_function("document.documentElement.hasAttribute('data-page-repli')", timeout=5000)
        t_repli = round(pg.evaluate("performance.now()"))
        z1 = pg.evaluate(SNAP)
        texte1 = txt(pg)
        check(f"{page} module pendant : repli à ~{t_repli} ms (≤ 2300), liens et pied visibles, message de repli affiché",
              t_repli <= 2300 and z1["vf"] == "visible" and z1["vl"] == "visible" and "JavaScript" in texte1, (t_repli, z1))
        mut1 = pg.evaluate("window.__mut")
        pg.wait_for_timeout(300)
        for r in tenues:
            r.continue_()
        pg.wait_for_timeout(1500)
        z2 = pg.evaluate(SNAP)
        check(f"{page} arrivée tardive du module : aucune mutation, pied immobile ({z1['foot']}→{z2['foot']}), repli conservé, aucun contenu surgi",
              pg.evaluate("window.__mut") == mut1 and z1["foot"] == z2["foot"] and txt(pg) == texte1 and pg.locator(".ligne-panier, #terminer").count() == 0, (mut1, pg.evaluate("window.__mut"), z1, z2))
        c.ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=["--no-sandbox"])
    for w in (320, 375, 768, 1440):
        parcours(b, w)
    for w in (320, 375, 768, 1440):
        parcours_clavier(b, w)
        retrait_clavier(b, w)
    for w in (320, 1440):
        pannes(b, w)
        mise_en_page(b, w)
    for w in (320, 375, 768, 1440):
        stabilite(b, w)
    b.close()
print(f"\n{NB[0]} contrôles, {len(KO)} échec(s)")
if KO:
    print("ÉCHECS :", KO)
    sys.exit(1)
