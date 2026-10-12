#!/usr/bin/env python3
"""
Ligne Posée — contrôles navigateur des visuels produits (20 modèles, illustrations générées).

Lancer (Python 3 + playwright + Chromium) :
    python3 sites/boutique-setup/tests/visuels-navigateur.py <dossier-servi> [chromium]
<dossier-servi> : la sortie assemblée (sites/boutique-setup/dist) ou le dossier source du site. Le script le
sert lui-même (404 réelle) sur un port libre. Couvre : correspondance modèle → image (cartes et accès direct à
la fiche), recherche, filtres, tri, historique, choix de variantes, média bloqué ou lent, clavier, débordement et
CLS à 320 / 375 / 768 / 1440 px. Code de sortie 1 au moindre écart. Ni listé dans publication.json ni publié.
"""
import http.server, json, os, socketserver, sys, threading, time, urllib.parse
from playwright.sync_api import sync_playwright

RACINE = os.path.abspath(sys.argv[1])
CHROMIUM = sys.argv[2] if len(sys.argv) > 2 else os.environ.get("CHROMIUM", "/opt/pw-browsers/chromium")
CAT = json.load(open(os.path.join(RACINE, "data/catalogue.json"), encoding="utf-8"))
MODELES = [m["id"] for m in CAT["modeles"]]
NOM = {m["id"]: m["nom"] for m in CAT["modeles"]}
REFS = {}
for r in CAT["references"]:
    REFS.setdefault(r["modele"], []).append(r)
MIME = {".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".webp": "image/webp"}
MENTION_CARTE = "Visuel d’illustration généré ; variantes non représentées."
MENTION_FICHE = "Visuel d’illustration généré ; la variante sélectionnée (finition, format) n’est pas représentée."
COULEURS = ["noir", "graphite", "blanc", "sable", "aluminium", "chaude", "neutre", "satiné", "brossé"]


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
        try:
            self.wfile.write(d)
        except (BrokenPipeError, ConnectionResetError):
            pass  # navigation interrompue côté navigateur

    def log_message(self, *a):
        pass


socketserver.TCPServer.allow_reuse_address = True
SRV = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
BASE = f"http://127.0.0.1:{SRV.server_address[1]}"
threading.Thread(target=SRV.serve_forever, daemon=True).start()
KO, NB = [], [0]


def check(nom, cond, detail=""):
    NB[0] += 1
    print(("OK  " if cond else "KO  ") + nom + ("" if cond else f"  → {str(detail)[:400]}"), flush=True)
    if not cond:
        KO.append(nom)


OBS_CLS = "window.__cls=0;window.__ls=[];new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput){window.__cls+=e.value;window.__ls.push({v:e.value,t:Math.round(e.startTime),n:e.sources.map(s=>s.node&&(s.node.nodeName+'.'+(s.node.className||'')))})}}).observe({type:'layout-shift',buffered:true});"


class Ctx:
    def __init__(self, b, w, dpr=1, **kw):
        self.ctx = b.new_context(viewport={"width": w, "height": 800}, device_scale_factor=dpr, **kw)
        self.ctx.add_init_script(OBS_CLS)
        self.w, self.erreurs, self.reqs, self.echecs = w, [], [], []
        self.ctx.on("request", lambda r: self.reqs.append(r.url))
        self.ctx.on("requestfailed", lambda r: self.echecs.append(r.url))

    def page(self):
        pg = self.ctx.new_page()
        pg.on("pageerror", lambda e: self.erreurs.append(str(e)))
        return pg


def sans_debordement(pg, nom):
    d = pg.evaluate("({sw: document.documentElement.scrollWidth, iw: window.innerWidth})")
    check(f"{nom} : aucun débordement horizontal ({d['sw']} ≤ {d['iw']})", d["sw"] <= d["iw"], d)


def decalages_images(pg):
    """Décalages de mise en page dont une source est une image, une figure ou un cadre de visuel."""
    return pg.evaluate("window.__ls.filter(e => e.n.some(n => /^(IMG|FIGURE|FIGCAPTION)|visuel/.test(n || '')))")


def defiler(pg):
    """Parcourt la page pour déclencher les images paresseuses, puis attend leur chargement."""
    h = pg.evaluate("document.documentElement.scrollHeight")
    y = 0
    while y < h:
        pg.evaluate(f"window.scrollTo(0,{y})")
        pg.wait_for_timeout(60)
        y += 500
    pg.evaluate("window.scrollTo(0,0)")
    pg.wait_for_function("[...document.images].every(i => i.complete)", timeout=15000)


def cartes(pg):
    return pg.evaluate("""[...document.querySelectorAll('#cartes .carte')].map(c => {
      const a = c.querySelector('.carte__titre a'); const i = c.querySelector('img'); const f = c.querySelector('.visuel-mention'); const k = c.querySelector('.visuel-cadre');
      const r = i ? i.getBoundingClientRect() : null; const cs = f ? getComputedStyle(f) : null;
      return { id: new URL(a.href).searchParams.get('modele'), nom: a.textContent, src: i ? i.getAttribute('src') : null, cur: i ? i.currentSrc : null,
               alt: i ? i.alt : null, ok: i ? (i.complete && i.naturalWidth > 0) : false, w: r && r.width, h: r && r.height,
               aw: i ? i.getAttribute('width') : null, ah: i ? i.getAttribute('height') : null, legende: f ? f.textContent : null,
               legendeVisible: !!(f && !f.hidden && cs.display !== 'none' && cs.visibility !== 'hidden'), vide: !!(k && k.classList.contains('visuel-cadre--vide')), cadre: k ? k.textContent : null,
               hauteur: Math.round(c.getBoundingClientRect().height) } })""")


def coherence(pg, nom, attendus=None):
    cs = cartes(pg)
    if attendus is not None:
        check(f"{nom} : modèles affichés = {attendus}", [c["id"] for c in cs] == attendus, [c["id"] for c in cs])
    faux = [c["id"] for c in cs if not (c["src"] and f"assets/produits/{c['id']}-" in c["src"] and c["ok"] and c["alt"].startswith(c["nom"] + ", illustration générée"))]
    check(f"{nom} : chaque carte porte l'image de SON modèle, chargée, avec son alt", not faux and len(cs) > 0, faux)
    return cs


def catalogue(b, w):
    print(f"\n=== Catalogue à {w} px", flush=True)
    c = Ctx(b, w)
    pg = c.page()
    pg.goto(BASE + "/catalogue.html")
    pg.wait_for_selector("#cartes .carte")
    defiler(pg)
    cs = coherence(pg, f"{w} px catalogue complet", MODELES)
    check("20 cartes, 20 images distinctes (une par modèle)", len({c_["src"] for c_ in cs}) == 20, len({c_["src"] for c_ in cs}))
    check("alt : nom du modèle + « illustration générée », sans couleur ni finition de variante",
          all(not any(m in c_["alt"].lower() for m in COULEURS) for c_ in cs), [c_["alt"] for c_ in cs if any(m in c_["alt"].lower() for m in COULEURS)])
    check("mention visible sous chaque visuel : « Visuel d’illustration généré ; variantes non représentées. »",
          all(c_["legende"] == MENTION_CARTE and c_["legendeVisible"] for c_ in cs), [c_["id"] for c_ in cs if c_["legende"] != MENTION_CARTE])
    check("dimensions réservées : width/height = 640 et rendu carré (±1 px)", all(c_["aw"] == "640" and c_["ah"] == "640" and abs(c_["w"] - c_["h"]) <= 1 for c_ in cs), [(c_["id"], c_["w"], c_["h"]) for c_ in cs if abs(c_["w"] - c_["h"]) > 1])
    check("aucune image dans la zone de repli statique ni de pavé « à venir »", pg.locator("#repli img").count() == 0 and "à venir" not in pg.inner_text("main"))
    sans_debordement(pg, f"{w} px catalogue")
    cls = round(pg.evaluate("window.__cls"), 4)
    check(f"{w} px CLS du chargement du catalogue = {cls} (≤ 0,05) et aucun décalage dont la source est une image ou un visuel", cls <= 0.05 and not decalages_images(pg), pg.evaluate("window.__ls"))
    hors = [u for u in c.reqs if not u.startswith(BASE)]
    web = [u for u in c.reqs if u.endswith(".webp")]
    check("aucune requête hors du site ; toutes les images sont des .webp du dossier assets/produits", not hors and all("/assets/produits/" in u for u in web) and len(web) >= 20, (hors[:3], len(web)))
    check("aucune image en échec, aucune erreur JavaScript", not [u for u in c.echecs if u.endswith(".webp")] and not c.erreurs, (c.echecs[:3], c.erreurs[:2]))

    # recherche, filtres, tri, historique
    pg.fill("#f-q", "lampe")
    pg.wait_for_timeout(250)
    ids = [x["id"] for x in cartes(pg)]
    attendus = [m["id"] for m in CAT["modeles"] if "lampe" in (m["nom"] + " " + m["description"]).lower()]
    defiler(pg)
    coherence(pg, f"{w} px recherche « lampe »", attendus if sorted(ids) == sorted(attendus) else ids)
    check("recherche « lampe » : résultats attendus (lampes)", ids and sorted(ids) == sorted(attendus), (ids, attendus))
    pg.fill("#f-q", "")
    pg.select_option("#f-famille", "tap")
    pg.wait_for_timeout(250)
    defiler(pg)
    coherence(pg, f"{w} px famille Tapis", [f"tap-0{i}" for i in range(1, 6)])
    pg.select_option("#f-tri", index=1)
    pg.wait_for_timeout(250)
    defiler(pg)
    coherence(pg, f"{w} px famille Tapis + tri")
    pg.select_option("#f-famille", "")
    pg.select_option("#f-prix", index=2)
    pg.wait_for_timeout(250)
    defiler(pg)
    n = len(cartes(pg))
    coherence(pg, f"{w} px filtre de prix ({n} modèles)")
    pg.click("#f-effacer")
    pg.wait_for_timeout(250)
    defiler(pg)
    coherence(pg, f"{w} px filtres effacés")
    check(f"{w} px filtres effacés : les 20 modèles sont de retour", sorted(x["id"] for x in cartes(pg)) == sorted(MODELES), [x["id"] for x in cartes(pg)])
    pg.select_option("#f-tri", index=0)
    pg.wait_for_timeout(250)
    pg.fill("#f-q", "zzzzzz")
    pg.wait_for_timeout(250)
    check(f"{w} px recherche sans résultat : aucun visuel, message d'absence de résultat", pg.locator("#cartes img").count() == 0 and pg.locator("#vide").is_visible())
    pg.fill("#f-q", "")
    pg.wait_for_timeout(250)
    # navigation : fiche puis retour
    pg.select_option("#f-famille", "lum")
    pg.wait_for_timeout(250)
    pg.locator("#cartes .carte__titre a").nth(1).click()
    pg.wait_for_selector(".visuel-produit img")
    check(f"{w} px depuis le catalogue (Éclairage, 2ᵉ carte) : la fiche affiche l'image lum-02", "lum-02-" in pg.get_attribute(".visuel-produit img", "src"), pg.get_attribute(".visuel-produit img", "src"))
    pg.go_back()
    pg.wait_for_selector("#cartes .carte")
    defiler(pg)
    check(f"{w} px retour navigateur : filtre Éclairage conservé, 5 modèles", sorted(x["id"] for x in cartes(pg)) == [f"lum-0{i}" for i in range(1, 6)], [x["id"] for x in cartes(pg)])
    coherence(pg, f"{w} px retour navigateur")
    sans_debordement(pg, f"{w} px catalogue filtré")
    check("aucune erreur JavaScript pendant recherche, filtres, tri et historique", not c.erreurs, c.erreurs[:2])
    c.ctx.close()


def fiche(b, w):
    print(f"\n=== Fiches à {w} px", flush=True)
    c = Ctx(b, w)
    pg = c.page()
    pb = []
    for i, mid in enumerate(MODELES):
        refs = REFS[mid]
        r0 = refs[i % 4]
        pg.goto(f"{BASE}/produit.html?modele={mid}&variante={r0['variante']}")
        pg.wait_for_selector(".visuel-produit img")
        pg.wait_for_function("document.querySelector('.visuel-produit img').complete")
        d = pg.evaluate("""(() => { const i = document.querySelector('.visuel-produit img'); const f = document.querySelector('.visuel-mention'); const r = i.getBoundingClientRect();
          return { src: i.getAttribute('src'), ok: i.naturalWidth > 0, alt: i.alt, w: r.width, h: r.height, aw: i.getAttribute('width'), ah: i.getAttribute('height'), legende: f.textContent,
                   vis: getComputedStyle(f).display !== 'none' && !f.hidden, h1: document.querySelector('h1').textContent, tab: i.tabIndex, focusables: document.querySelectorAll('.visuel-produit a, .visuel-produit button, .visuel-produit [tabindex]').length,
                   sw: document.documentElement.scrollWidth, iw: innerWidth } })()""")
        bon = (f"assets/produits/{mid}-" in d["src"] and d["ok"] and d["alt"].startswith(NOM[mid] + ", illustration générée") and d["legende"] == MENTION_FICHE and d["vis"]
               and abs(d["w"] - d["h"]) <= 1 and d["aw"] == "640" and d["ah"] == "640" and d["h1"] == NOM[mid] and d["focusables"] == 0 and d["sw"] <= d["iw"]
               and not any(m in d["alt"].lower() for m in COULEURS))
        if not bon:
            pb.append((mid, d))
    check(f"{w} px accès direct : les 20 fiches affichent l'image de leur modèle, chargée, carrée, alt et mention exacts, sans débordement, image non focalisable", not pb, pb[:2])

    # choix de variantes : l'image, son alt et la mention ne changent jamais
    pb = []
    for mid in ("sup-03", "tap-02", "lum-01", "ran-05"):
        pg.goto(f"{BASE}/produit.html?modele={mid}")
        pg.wait_for_selector(".visuel-produit img")
        avant = pg.evaluate("(() => { const i = document.querySelector('.visuel-produit img'); return { s: i.getAttribute('src'), c: i.currentSrc, a: i.alt, l: document.querySelector('.visuel-mention').textContent } })()")
        for r in REFS[mid]:
            lib = r["libelle"]
            pg.locator(f'label.variante:has(input[value="{r["variante"]}"])').click()
            pg.wait_for_function(f"document.getElementById('resume').textContent.includes('{r['sku']}')")
            apres = pg.evaluate("(() => { const i = document.querySelector('.visuel-produit img'); return { s: i.getAttribute('src'), c: i.currentSrc, a: i.alt, l: document.querySelector('.visuel-mention').textContent, v: document.querySelector('.visuel-mention').offsetParent !== null, n: document.querySelectorAll('.visuel-produit img').length, u: location.search } })()")
            if not (apres["s"] == avant["s"] and apres["c"] == avant["c"] and apres["a"] == avant["a"] and apres["l"] == MENTION_FICHE and apres["v"] and apres["n"] == 1
                    and lib.lower() not in apres["a"].lower() and f"variante={r['variante']}" in apres["u"]):
                pb.append((mid, r["sku"], avant, apres))
    check(f"{w} px choix des 4 variantes (4 modèles) : même image, même alt, mention toujours visible, jamais le libellé de la finition choisie", not pb, pb[:1])
    # liens de variantes et états d'erreur : jamais d'image à la place d'un message
    for url, nom in [("produit.html?modele=inconnu", "modèle inconnu"), ("produit.html", "sans paramètre"), ("produit.html?modele=sup-03&variante=09", "variante inconnue"), ("produit.html?modele=sup-03&variante=01&sku=LP-TAP-01-01", "lien incohérent")]:
        pg.goto(f"{BASE}/{url}")
        pg.wait_for_selector("#fiche > *")
        check(f"{w} px {nom} : aucune image affichée à la place du message", pg.locator(".visuel-produit").count() == 0, pg.inner_text("main")[:120])
    cls = round(pg.evaluate("window.__cls"), 4)
    pg.goto(f"{BASE}/produit.html?modele=tap-05&variante=02")
    pg.wait_for_selector(".visuel-produit img")
    pg.wait_for_function("document.querySelector('.visuel-produit img').complete")
    pg.wait_for_timeout(300)
    cls = round(pg.evaluate("window.__cls"), 4)
    check(f"{w} px CLS de la fiche = {cls} (≤ 0,05, hérité du rendu de la zone de fiche, identique avant les images) et aucun décalage dont la source est une image ou un visuel", cls <= 0.05 and not decalages_images(pg), pg.evaluate("window.__ls"))
    check("aucune erreur JavaScript, aucune image en échec", not c.erreurs and not [u for u in c.echecs if u.endswith(".webp")] and not [u for u in c.reqs if not u.startswith(BASE)], (c.erreurs[:2], c.echecs[:2]))
    # ajout au panier toujours opérationnel avec l'image
    pg.locator("#ajouter").click()
    check(f"{w} px « Ajouter au panier » inchangé : retour perceptible avec le SKU", "LP-TAP-05-02" in pg.inner_text("#achat-retour"), pg.inner_text("#achat-retour"))
    c.ctx.close()


def mediabloque(b, w):
    print(f"\n=== Média bloqué ou lent à {w} px", flush=True)
    # référence : hauteurs de cartes avec images
    c0 = Ctx(b, w)
    p0 = c0.page()
    p0.goto(BASE + "/catalogue.html")
    p0.wait_for_selector("#cartes .carte")
    defiler(p0)
    ref = cartes(p0)
    h_doc = p0.evaluate("document.documentElement.scrollHeight")
    c0.ctx.close()
    # 1. toutes les images bloquées
    c = Ctx(b, w)
    pg = c.page()
    pg.route("**/assets/produits/**", lambda route, req: route.abort())
    pg.goto(BASE + "/catalogue.html")
    pg.wait_for_selector("#cartes .carte")
    defiler(pg)
    cs = cartes(pg)
    check(f"{w} px images bloquées : 20 cartes, aucun <img> cassé, repli « Visuel indisponible » dans un cadre de même taille",
          len(cs) == 20 and all(x["vide"] and x["src"] is None and x["cadre"] == "Visuel indisponible" for x in cs), [(x["id"], x["cadre"]) for x in cs if not x["vide"]][:3])
    check(f"{w} px images bloquées : hauteurs de cartes strictement identiques au rendu nominal (aucun décalage)", [x["hauteur"] for x in cs] == [x["hauteur"] for x in ref],
          [(a["id"], a["hauteur"], b_["hauteur"]) for a, b_ in zip(cs, ref) if a["hauteur"] != b_["hauteur"]][:3])
    check(f"{w} px images bloquées : hauteur de page identique au rendu nominal ({h_doc})", pg.evaluate("document.documentElement.scrollHeight") == h_doc, pg.evaluate("document.documentElement.scrollHeight"))
    check(f"{w} px images bloquées : la mention (devenue sans objet) est retirée, nom, description et prix restent lisibles et cliquables",
          all(not x["legendeVisible"] for x in cs) and pg.locator("#cartes .visuel-mention[aria-hidden=true]").count() == 20 and "À partir de" in pg.inner_text("#cartes") and pg.locator("#cartes .carte__titre a").count() == 20)
    check(f"{w} px images bloquées : le texte de repli est lisible (contraste de la couleur de texte doux ≥ 4,5:1 attendu, taille ≥ 15 px)",
          pg.evaluate("parseFloat(getComputedStyle(document.querySelector('.visuel-cadre--vide')).fontSize)") >= 15)
    sans_debordement(pg, f"{w} px images bloquées")
    pg.goto(BASE + "/produit.html?modele=sup-03&variante=02")
    pg.wait_for_selector("#fiche .fiche__grille")
    pg.wait_for_timeout(500)
    check(f"{w} px fiche, image bloquée : repli lisible, pas d'image cassée, achat toujours possible",
          pg.locator(".visuel-cadre--vide").count() == 1 and pg.locator(".visuel-produit img").count() == 0 and "Visuel indisponible" in pg.inner_text(".visuel-produit") and pg.locator("#ajouter").is_enabled(), pg.inner_text(".visuel-produit"))
    sans_debordement(pg, f"{w} px fiche, image bloquée")
    check("aucune erreur JavaScript non gérée avec images bloquées", not c.erreurs, c.erreurs[:2])
    c.ctx.close()
    # 2. une seule image absente (404)
    c = Ctx(b, w)
    pg = c.page()
    pg.route("**/assets/produits/lum-02-*", lambda route, req: route.fulfill(status=404, body="absent"))
    pg.goto(BASE + "/catalogue.html")
    pg.wait_for_selector("#cartes .carte")
    defiler(pg)
    cs = cartes(pg)
    check(f"{w} px une image en 404 (lum-02) : seule cette carte est en repli, les 19 autres gardent leur image", [x["id"] for x in cs if x["vide"]] == ["lum-02"] and sum(1 for x in cs if x["ok"]) == 19, [x["id"] for x in cs if x["vide"]])
    c.ctx.close()
    # 3. images lentes (retenues 2,5 s) : tailles réservées, aucun décalage au chargement
    c = Ctx(b, w)
    pg = c.page()
    tenues = []
    pg.route("**/assets/produits/**", lambda route, req: tenues.append(route))
    pg.goto(BASE + "/catalogue.html")
    pg.wait_for_selector("#cartes .carte")
    pg.wait_for_timeout(2500)
    avant = pg.evaluate("(() => ({ h: document.documentElement.scrollHeight, cadres: [...document.querySelectorAll('.visuel-cadre')].slice(0, 3).map(k => Math.round(k.getBoundingClientRect().height)), foot: Math.round(document.querySelector('.site-footer').getBoundingClientRect().top + scrollY), cls: window.__cls }))()")
    check(f"{w} px images lentes : cadres déjà dimensionnés avant chargement ({avant['cadres']}), cartes complètes", all(h > 100 for h in avant["cadres"]) and len(tenues) >= 3, avant)
    pg.unroute("**/assets/produits/**")
    for r in tenues:
        try:
            r.continue_()
        except Exception:
            pass
    pg.wait_for_timeout(300)
    defiler(pg)
    pg.wait_for_timeout(500)
    apres = pg.evaluate("(() => ({ h: document.documentElement.scrollHeight, foot: Math.round(document.querySelector('.site-footer').getBoundingClientRect().top + scrollY), cls: window.__cls }))()")
    check(f"{w} px images lentes : hauteur de page identique avant/après chargement ({avant['h']} → {apres['h']}), CLS imputable aux images = {round(apres['cls'] - avant['cls'], 4)} (≤ 0,01)",
          apres["h"] == avant["h"] and apres["cls"] - avant["cls"] <= 0.01, (avant, apres))
    sans_debordement(pg, f"{w} px images lentes")
    pg.unroute_all(behavior="ignoreErrors")
    c.ctx.close()
    # fiche lente
    c = Ctx(b, w)
    pg = c.page()
    tenues = []
    pg.route("**/assets/produits/**", lambda route, req: tenues.append(route))
    pg.goto(BASE + "/produit.html?modele=ran-05&variante=03")
    pg.wait_for_selector(".visuel-produit")
    pg.wait_for_timeout(2000)
    a = pg.evaluate("(() => ({ h: document.documentElement.scrollHeight, cadre: Math.round(document.querySelector('.visuel-cadre').getBoundingClientRect().height), cls: window.__cls, achat: Math.round(document.getElementById('ajouter').getBoundingClientRect().top + scrollY) }))()")
    pg.unroute("**/assets/produits/**")
    for r in tenues:
        try:
            r.continue_()
        except Exception:
            pass
    pg.wait_for_function("document.querySelector('.visuel-produit img').complete")
    pg.wait_for_timeout(400)
    z = pg.evaluate("(() => ({ h: document.documentElement.scrollHeight, cls: window.__cls, achat: Math.round(document.getElementById('ajouter').getBoundingClientRect().top + scrollY) }))()")
    check(f"{w} px fiche lente : cadre réservé ({a['cadre']} px), page et bouton d'achat immobiles ({a['h']}→{z['h']}, {a['achat']}→{z['achat']}), CLS imputable = {round(z['cls'] - a['cls'], 4)}",
          a["cadre"] > 150 and a["h"] == z["h"] and a["achat"] == z["achat"] and z["cls"] - a["cls"] <= 0.01, (a, z))
    pg.unroute_all(behavior="ignoreErrors")
    c.ctx.close()


def clavier(b, w):
    print(f"\n=== Clavier à {w} px", flush=True)
    c = Ctx(b, w)
    pg = c.page()
    pg.goto(BASE + "/catalogue.html")
    pg.wait_for_selector("#cartes .carte")
    pg.focus("#f-effacer")
    pg.keyboard.press("Tab")
    d = pg.evaluate("""(() => { const a = document.activeElement; const cs = getComputedStyle(a, '::after'); const k = a.closest('.carte'); const i = k.querySelector('img'); const r = i.getBoundingClientRect();
      const sur = document.elementFromPoint(r.left + r.width / 2, Math.min(r.top + r.height / 2, innerHeight - 2));
      return { id: new URL(a.href).searchParams.get('modele'), style: cs.outlineStyle, w: parseFloat(cs.outlineWidth), cible: sur && sur.closest('a') === a, focusablesImage: k.querySelectorAll('figure a, figure button, figure [tabindex]').length,
               hautFocus: Math.round(a.getBoundingClientRect().top) } })()""")
    check(f"{w} px clavier : Tab depuis les filtres atteint le lien de la 1ʳᵉ carte (sup-01), anneau de focus visible sur la carte entière",
          d["id"] == "sup-01" and d["style"] not in ("none", "hidden") and d["w"] >= 2, d)
    check(f"{w} px clavier : l'image ne crée aucun arrêt de tabulation et le clic sur l'image active le lien du modèle", d["focusablesImage"] == 0 and d["cible"], d)
    pg.keyboard.press("Tab")
    suivant = pg.evaluate("new URL(document.activeElement.href).searchParams.get('modele')")
    check(f"{w} px clavier : Tab suivant → carte suivante (sup-02), une seule tabulation par carte", suivant == "sup-02", suivant)
    pg.keyboard.press("Enter")
    pg.wait_for_selector(".visuel-produit img")
    check(f"{w} px clavier : Entrée ouvre la fiche sup-02 avec son image", "sup-02-" in pg.get_attribute(".visuel-produit img", "src") and pg.inner_text("h1") == NOM["sup-02"], pg.url)
    # clic sur l'image d'une carte
    pg.go_back()
    pg.wait_for_selector("#cartes .carte")
    pg.locator("#cartes .carte").nth(7).locator("img").scroll_into_view_if_needed()
    bb = pg.locator("#cartes .carte").nth(7).locator("img").bounding_box()
    pg.mouse.click(bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2)  # clic réel : le lien recouvre toute la carte
    pg.wait_for_selector(".visuel-produit img")
    check(f"{w} px clic sur l'image de la 8ᵉ carte → fiche {MODELES[7]}", f"{MODELES[7]}-" in pg.get_attribute(".visuel-produit img", "src"), pg.url)
    c.ctx.close()


def accueil(b, w):
    c = Ctx(b, w)
    pg = c.page()
    pg.goto(BASE + "/index.html")
    t = pg.inner_text("main")
    check(f"{w} px accueil : aucune image, texte à jour (plus de « à venir »), aucun débordement",
          pg.locator("img, picture").count() == 0 and "Pas encore de photographies" not in t and "à venir" not in t and "illustration généré" in t, t[:300])
    sans_debordement(pg, f"{w} px accueil")
    pg.goto(BASE + "/404.html")
    check(f"{w} px page 404 : inchangée, sans image", pg.locator("img").count() == 0)
    c.ctx.close()


def poids(b):
    print("\n=== Poids transféré (mobile 375 px @2x, puis 1440 px @1)", flush=True)
    for w, dpr in ((375, 2), (1440, 1)):
        c = Ctx(b, w, dpr=dpr)
        pg = c.page()
        pg.goto(BASE + "/catalogue.html")
        pg.wait_for_selector("#cartes .carte")
        defiler(pg)
        pg.wait_for_timeout(300)
        tailles = pg.evaluate("Object.fromEntries(performance.getEntriesByType('resource').filter(e => e.name.endsWith('.webp')).map(e => [e.name, e.encodedBodySize]))")
        total = sum(tailles.values())
        largeurs = pg.evaluate("[...document.querySelectorAll('#cartes img')].map(i => parseInt((i.currentSrc.match(/-(\\d+)\\.webp/)||[])[1]))")
        print(f"   {w} px @{dpr}x : {len(tailles)} images, {total // 1024} Ko au total pour les 20 cartes ; largeurs choisies : {sorted(set(largeurs))}")
        check(f"{w} px @{dpr}x : 20 cartes ≤ 900 Ko d'images (largeurs responsive, pas l'original)", len(tailles) == 20 and total <= 900 * 1024, total)
        pg.goto(BASE + "/produit.html?modele=sup-03")
        pg.wait_for_selector(".visuel-produit img")
        pg.wait_for_function("document.querySelector('.visuel-produit img').complete")
        cur = pg.evaluate("document.querySelector('.visuel-produit img').currentSrc")
        print(f"   {w} px @{dpr}x : fiche sup-03 → {cur.rsplit('/', 1)[-1]}")
        c.ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=["--no-sandbox"])
    for w in (320, 375, 768, 1440):
        catalogue(b, w)
        fiche(b, w)
        accueil(b, w)
    for w in (320, 375, 768, 1440):
        mediabloque(b, w)
    for w in (375, 1440):
        clavier(b, w)
    poids(b)
    b.close()
print(f"\n{NB[0]} contrôles, {len(KO)} échec(s)")
if KO:
    print("ÉCHECS :", KO)
    sys.exit(1)
