/*
  Ligne Posée — petits utilitaires DOM. Les contenus (données, saisies, URL)
  sont toujours insérés comme du texte : jamais d'innerHTML.
*/

/** el("a", { href: "x", class: "y" }, "texte", autreNoeud) */
export function el(nom, attributs = {}, ...enfants) {
  const noeud = document.createElement(nom);
  for (const [cle, valeur] of Object.entries(attributs)) {
    if (valeur === false || valeur === null || valeur === undefined) continue;
    noeud.setAttribute(cle, valeur === true ? "" : String(valeur));
  }
  for (const enfant of enfants.flat()) {
    if (enfant === null || enfant === undefined || enfant === false) continue;
    noeud.append(enfant instanceof Node ? enfant : document.createTextNode(String(enfant)));
  }
  return noeud;
}

export function vider(noeud) {
  while (noeud.firstChild) noeud.removeChild(noeud.firstChild);
}

/** Charge et valide data/catalogue.json (chemin résolu depuis ce module). */
export async function chargerCatalogue(validerCatalogue) {
  const url = new URL("../data/catalogue.json", import.meta.url);
  let reponse;
  try {
    reponse = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (e) {
    return { ok: false, erreurs: [`Réseau : ${e && e.message ? e.message : "échec"}`] };
  }
  if (!reponse.ok) return { ok: false, erreurs: [`Réponse HTTP ${reponse.status}`] };
  let donnees;
  try {
    donnees = await reponse.json();
  } catch {
    return { ok: false, erreurs: ["JSON illisible."] };
  }
  try {
    return validerCatalogue(donnees);
  } catch {
    // Filet de sécurité : un validateur qui lèverait malgré tout reste un échec contrôlé.
    return { ok: false, erreurs: ["Validation impossible : données inattendues."] };
  }
}
