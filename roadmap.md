# Roadmap

- [x] Přihlášení jménem a heslem do 10 znaků, registrace při prvním použití jména a nabídka registrovaných jmen; ověřeno registrací, odmítnutím chybného hesla, přihlášením z nabídky, obnovením stránky a dokončením 15otázkového kola s uložením výsledku. Všech 30 testů prošlo.

- [x] Ukládat chybné otázky dokončených testů a nabídnout nový test z chyb pro stejné jméno a obor; ověřeno dokončením běžného kola i opakování po obnovení stránky (stejných 15 otázek), 19 testy a mobilní kontrolou bez vodorovného přesahu. Starší výsledky bez uložených odpovědí nelze zpětně rekonstruovat.

- [x] Přehled chybných odpovědí na konci testu včetně správného řešení (výběr i přiřazování); ověřeno dokončením skutečného 15otázkového kola.
- [x] Kola Rychlovka 15, Výzva 30 a Mistr 50; 12 testů prošlo, všechny délky ověřeny v náhledu, mobil bez vodorovného přesahu.

- [x] Výsledky: dvě podkategorie (Podle jména / Podle oboru) s přepínačem nahoře
- [x] Ukládat obor k výsledku (sloupec subject v quiz_results)
- [x] Ověření obou pohledů v náhledu (Playwright)
- [x] Tlačítko pro vypnutí/zapnutí zvuku (přehrávání výslovnosti)
- [x] Administrace: výběr otázek, filtr kategorie a potvrzené hromadné mazání pouze ve vybraném oboru; ověřeno 7 testy a přihlášeným průchodem na dvou dočasných otázkách.
- [x] Výsledky „Podle jména": u každého záznamu popisek oboru (🇬🇧 Angličtina / 🇨🇿 Čeština / 🔢 Matematika); ověřeno v náhledu na dočasných záznamech, které byly poté smazány.
