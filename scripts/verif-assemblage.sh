#!/usr/bin/env bash
# Vérifications locales de l'assemblage — docs/ARCHITECTURE.md § 5.6, points 1 à 3 et 6.
#
# Ajout de Claude au-delà des fichiers nommés par le contrat : il rend les
# contrôles rejouables à l'identique plutôt que décrits en prose. Les points 4
# et 5 (service HTTP de dist/ seul, rendu navigateur) restent manuels, faute de
# navigateur dans l'environnement local.
#
#   bash scripts/verif-assemblage.sh
set -uo pipefail
cd "$(dirname "$0")/.."
RACINE="$PWD"
SITE=sites/coiffeur-mixte
DIST=$SITE/dist
ECHECS=0

ok()   { echo "[OK] $1${2:+ — $2}"; }
ko()   { echo "[FAIL] $1${2:+ — $2}"; ECHECS=$((ECHECS+1)); }
juge() { if [ "$1" = "0" ]; then ok "$2" "${3-}"; else ko "$2" "${3-}"; fi; }

empreinte_dist() { (cd "$DIST" && find . -type f | sort | xargs shasum -a 256 | shasum -a 256 | cut -d' ' -f1); }

echo "########## 1. Modes et politiques ##########"

node scripts/assemble-site.mjs coiffeur-mixte --environment production >/tmp/prod.log 2>&1
juge $? "assemblage production" "$(grep 'Mode effectif' /tmp/prod.log | sed 's/.*: //')"
grep -q 'content="noindex, follow"' $DIST/index.html && ok "démo/production : pages en noindex" || ko "démo/production : pages en noindex"
grep -q 'X-Robots-Tag: noindex, follow' $DIST/_headers && ok "démo/production : en-tête global noindex" || ko "démo/production : en-tête global noindex"

node scripts/assemble-site.mjs coiffeur-mixte --environment preview >/tmp/prev.log 2>&1
juge $? "assemblage preview"
grep -q 'content="noindex, follow"' $DIST/index.html && ok "démo/preview : pages en noindex" || ko "démo/preview : pages en noindex"

# Repli : environnement absent
env -u PUBLICATION_ENV -u CF_PAGES -u CF_PAGES_BRANCH node scripts/assemble-site.mjs coiffeur-mixte >/tmp/defaut.log 2>&1
grep -q "Mode effectif   : preview" /tmp/defaut.log && ok "environnement absent → preview" || ko "environnement absent → preview" "$(grep 'Mode effectif' /tmp/defaut.log)"

# Repli : branche non-main sous Pages, malgré PUBLICATION_ENV=production
PUBLICATION_ENV=production CF_PAGES=1 CF_PAGES_BRANCH=une-branche \
  node scripts/assemble-site.mjs coiffeur-mixte >/tmp/branche.log 2>&1
grep -q "ramené depuis « production »" /tmp/branche.log && ok "branche ≠ main → preview forcé" || ko "branche ≠ main → preview forcé" "$(grep 'Mode effectif' /tmp/branche.log)"

PUBLICATION_ENV=production CF_PAGES=1 CF_PAGES_BRANCH=main \
  node scripts/assemble-site.mjs coiffeur-mixte >/tmp/main.log 2>&1
grep -q "Mode effectif   : production" /tmp/main.log && ok "branche main → production conservée" || ko "branche main → production conservée"

# Valeur inconnue : échec explicite
PUBLICATION_ENV=staging node scripts/assemble-site.mjs coiffeur-mixte >/tmp/bad.log 2>&1
[ $? -ne 0 ] && grep -q "Environnement invalide" /tmp/bad.log && ok "environnement inconnu → échec explicite" || ko "environnement inconnu → échec explicite"

echo
echo "########## 1b. Branche portfolio/production (données temporaires) ##########"
TMP=sites/tmp-portfolio-test
rm -rf "$TMP"; mkdir -p "$TMP"
printf '<!doctype html><html lang="fr"><head><meta charset="UTF-8"><title>t</title></head><body><a href="/">a</a></body></html>\n' > "$TMP/index.html"
cp "$TMP/index.html" "$TMP/404.html"
cat > "$TMP/publication.json" <<'JSON'
{ "kind": "portfolio", "pages": ["index.html", "404.html"], "publicFiles": [], "sharedFiles": [] }
JSON

node scripts/assemble-site.mjs tmp-portfolio-test --environment production >/tmp/pf-prod.log 2>&1
juge $? "portfolio/production : assemblage"
grep -q 'content="index, follow"' "$TMP/dist/index.html" && ok "portfolio/production : page indexable" || ko "portfolio/production : page indexable"
grep -q 'content="noindex, follow"' "$TMP/dist/404.html" && ok "portfolio/production : 404 en noindex" || ko "portfolio/production : 404 en noindex"
grep -qE '^/\*$' "$TMP/dist/_headers" && ko "portfolio/production : pas de règle globale noindex" "règle /* présente" || ok "portfolio/production : pas de règle globale noindex"
grep -q 'pages.dev/\*' "$TMP/dist/_headers" && ok "portfolio/production : règle d'hôte versionnée présente" || ko "portfolio/production : règle d'hôte versionnée présente"

node scripts/assemble-site.mjs tmp-portfolio-test --environment preview >/tmp/pf-prev.log 2>&1
grep -q 'content="noindex, follow"' "$TMP/dist/index.html" && ok "portfolio/preview : page en noindex" || ko "portfolio/preview : page en noindex"

echo
echo "########## 2. Déterminisme, entrées invalides, isolation ##########"
node scripts/assemble-site.mjs coiffeur-mixte --environment production >/dev/null 2>&1
H1=$(empreinte_dist)
node scripts/assemble-site.mjs coiffeur-mixte --environment production >/dev/null 2>&1
H2=$(empreinte_dist)
[ "$H1" = "$H2" ] && ok "déterminisme : deux assemblages identiques" "sha256 $H1" || ko "déterminisme" "$H1 vs $H2"

# Sentinelles : rien d'autre que la sortie ciblée ne doit être touché
echo sentinelle > "$TMP/dist-sentinelle.txt"
mkdir -p "$TMP/dist" && echo autre > "$TMP/dist/marqueur.txt"
SENTINELLE_SITE=$(mktemp "$SITE/.sentinelle-XXXX")
node scripts/assemble-site.mjs coiffeur-mixte --environment production >/dev/null 2>&1
[ -f "$TMP/dist-sentinelle.txt" ] && ok "un autre dossier source n'est pas nettoyé" || ko "un autre dossier source n'est pas nettoyé"
[ -f "$TMP/dist/marqueur.txt" ] && ok "le dist/ d'un autre site n'est pas nettoyé" || ko "le dist/ d'un autre site n'est pas nettoyé"
[ -f "$SENTINELLE_SITE" ] && ok "le dossier source du site n'est pas nettoyé" || ko "le dossier source du site n'est pas nettoyé"
rm -f "$SENTINELLE_SITE"

for cas in "slug-inexistant:Site inconnu" "../etc:Slug invalide" "Coiffeur_Mixte:Slug invalide"; do
  slug=${cas%%:*}; attendu=${cas#*:}
  node scripts/assemble-site.mjs "$slug" --environment production >/tmp/slug.log 2>&1
  code=$?
  { [ $code -ne 0 ] && grep -q "$attendu" /tmp/slug.log; } \
    && ok "slug refusé : « $slug »" "$attendu" || ko "slug refusé : « $slug »" "code=$code $(head -1 /tmp/slug.log)"
done

# Entrée manquante dans le manifeste
cp $SITE/publication.json /tmp/manifeste.bak
python3 - <<'PY'
import json
m=json.load(open("sites/coiffeur-mixte/publication.json"))
m["publicFiles"].append("css/inexistant.css")
json.dump(m, open("sites/coiffeur-mixte/publication.json","w"), indent=2, ensure_ascii=False)
PY
node scripts/assemble-site.mjs coiffeur-mixte --environment production >/tmp/miss.log 2>&1
code=$?
{ [ $code -ne 0 ] && grep -q "introuvable" /tmp/miss.log; } \
  && ok "entrée manquante → échec explicite" "$(grep -o 'introuvable.*' /tmp/miss.log | head -1)" \
  || ko "entrée manquante → échec explicite" "code=$code"

# Chemin sortant et collision de nom réservé
python3 - <<'PY'
import json
m=json.load(open("/tmp/manifeste.bak"))
m["publicFiles"]=["../../shared/design-system/tokens.css"]
json.dump(m, open("sites/coiffeur-mixte/publication.json","w"), indent=2, ensure_ascii=False)
PY
node scripts/assemble-site.mjs coiffeur-mixte --environment production >/tmp/esc.log 2>&1
{ [ $? -ne 0 ] && grep -q "interdit" /tmp/esc.log; } && ok "chemin remontant refusé" || ko "chemin remontant refusé" "$(head -1 /tmp/esc.log)"

python3 - <<'PY'
import json
m=json.load(open("/tmp/manifeste.bak"))
m["publicFiles"]=["robots.txt"]
json.dump(m, open("sites/coiffeur-mixte/publication.json","w"), indent=2, ensure_ascii=False)
PY
node scripts/assemble-site.mjs coiffeur-mixte --environment production >/tmp/col.log 2>&1
{ [ $? -ne 0 ] && grep -q "réservé" /tmp/col.log; } && ok "collision avec un nom réservé refusée" || ko "collision avec un nom réservé refusée" "$(head -1 /tmp/col.log)"

cp /tmp/manifeste.bak $SITE/publication.json

echo
echo "########## 3. Inventaire et empreintes ##########"
node scripts/assemble-site.mjs coiffeur-mixte --environment production >/dev/null 2>&1
python3 - <<'PY'
import json, os, hashlib, sys
site="sites/coiffeur-mixte"; dist=f"{site}/dist"
m=json.load(open(f"{site}/publication.json"))
attendu = set(m["pages"]) | set(m["publicFiles"]) | {f"shared/{s}" for s in m["sharedFiles"]} | {"robots.txt","_headers"}
reel = set()
for d,_,fs in os.walk(dist):
    for n in fs:
        reel.add(os.path.relpath(os.path.join(d,n), dist))
manquants = attendu - reel; en_trop = reel - attendu
print(("[OK] " if not manquants and not en_trop else "[FAIL] ") +
      f"inventaire conforme au manifeste — {len(reel)} fichiers"
      + (f" ; manquants={sorted(manquants)}" if manquants else "")
      + (f" ; en trop={sorted(en_trop)}" if en_trop else ""))

interdits=[r for r in reel if r.startswith(("docs/","Claude outputs/",".git")) or r.endswith(("publication.json",".node-version"))]
print(("[OK] " if not interdits else "[FAIL] ") + "aucune source interne, capture ou configuration publiée"
      + (f" — {interdits}" if interdits else ""))

def h(p):
    return hashlib.sha256(open(p,"rb").read()).hexdigest()
diff=[]
for rel in m["publicFiles"]:
    if h(f"{site}/{rel}") != h(f"{dist}/{rel}"): diff.append(rel)
for rel in m["sharedFiles"]:
    if h(f"shared/{rel}") != h(f"{dist}/shared/{rel}"): diff.append(f"shared/{rel}")
print(("[OK] " if not diff else "[FAIL] ") +
      f"médias, polices et notices copiés octet pour octet — {len(m['publicFiles'])+len(m['sharedFiles'])} fichiers vérifiés"
      + (f" ; divergents={diff}" if diff else ""))
sys.exit(1 if manquants or en_trop or interdits or diff else 0)
PY
[ $? -ne 0 ] && ECHECS=$((ECHECS+1))

echo
echo "########## 6. Fichiers générés ##########"
[ -f "$DIST/404.html" ] && ok "404.html présent dans la sortie" || ko "404.html présent dans la sortie"
[ "$(cat $DIST/robots.txt)" = "$(printf 'User-agent: *\nAllow: /')" ] && ok "robots.txt conforme (2 lignes, Allow: /)" || ko "robots.txt conforme"
grep -q "Disallow" $DIST/robots.txt && ko "robots.txt sans Disallow" || ok "robots.txt sans Disallow"
grep -q "Content-Type: text/plain; charset=utf-8" $DIST/_headers && ok "_headers : type MIME des notices" || ko "_headers : type MIME des notices"
n=$(grep -c '<meta name="robots"' $DIST/index.html); [ "$n" = "1" ] && ok "une seule balise robots par page" || ko "une seule balise robots par page" "$n"

rm -rf "$TMP"
echo
echo "ÉCHECS : $ECHECS"
exit $((ECHECS > 0))
