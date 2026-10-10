# Custom Builder – sisemiste detailide vahetus

Rakendatud olemasolevas mängus:
C:/Users/sebas/Documents/Codex/2026-09-16/mul-x20/work/kukirin-source

## Kasutamine
Ava Custom Parts. Vali Motor, Battery või Controller ja vajuta “Edit internal components” / “Ehita ja vaheta sisemisi detaile”.
Ka mudeli puudutamine avab vastava pesa. Varasema salvestatud jupi juures on “Edit internals”.

- Puudutus või hiireklõps valib mudelis konkreetse detaili. Valgustub üks pesa.
- Valitud detaili saab eraldi suurendada, pöörata ja lohistada.
- Eemaldamine ja asendamine on animeeritud.
- Asendusvalik näitab tootjat, mudelit, virtuaalset hinda, liidest ja näitajate võrdlust.
- Aku elemendid on eraldi nummerdatud; iga pesa säilitab mudeli ja seisukorra.
- Mootoril on 10 koostepesa. Kontrolleril on 33 pesa, sealhulgas 12 eraldi MOSFET-i, 3 gate driver'it, 3 vooluandurit ja 3 kondensaatorit.
- “Undo last change” taastab eelneva muudatuse. “Cancel changes” jätab salvestuse muutmata.
- “Save build” salvestab ka poolelioleva ehituse. Puuduv, läbikulunud või sobimatu osa takistab testimist ja uue jupi paigaldamist.
- Varem paigaldatud sama jupi muutmisel uuendatakse olemasolevate ehituste viidet. Karjäärisalvestusi ei kirjutata üle.

## Simulatsioon
Sisemised valikud tuletavad olemasoleva simulatsiooni jaoks aku mahtuvuse/voolupiiri/kuumenemisteguri, mootori võimsuse/pöörlemiskiiruse lähteandmed või kontrolleri voolupiiri.
Aku puhul piirab tulemust nõrgim jadagrupp ja BMS. Segatud elementide kohta kuvatakse hoiatus. Erinev liides ei muutu automaatselt sobivaks.

Valikute tootjad ja näitajad on selgelt virtuaalsed mängumudelid, mitte päris seadmete tootjaandmed ega ehitamisjuhised.
Aku töökoda toetab kuni 240 nähtavat, eraldi valitavat elementi. Suurema konfiguratsiooni korral antakse hoiatus.

## Kontrollid
- 68 pesa ja 272 ühe pesa mudelivahetuse varianti: olemasolev geomeetria, lõplikud koordinaadid ja andmekoppel.
- Eemaldamine, asendamine, sobimatuse hoiatus, tagasivõtmine, salvestus ja uuesti avamine.
- Konkreetse MOSFET-i valimine mudeli klõpsamisega; puutevalik ja vahetus 390 × 844 telefonivaates.
- Aku, mootori, kontrolleri ning tõuksi lõppvaated visuaalselt üle vaadatud.
- Olemasolev kontrolleri automaatne kokkupanek jõudis testi etapini.
- Paigaldatud kontrolleri näitajad värskendusid; pooleliolev ehitus salvestus; karjääriandmed ja stock-näitajad säilisid.
- Sobimatu 21700 elemendi 21:70 proportsioon ja blokeeritud ühilduvus kontrollitud eraldi.
- Veebiversiooni lint ja build läbisid kontrolli.

Telefonikatse kasutab brauseri puuteemulatsiooni; päris Android-seadme jõudlust pole selles töös mõõdetud.
Sõidufüüsika valemeid, karjäärifunktsioone ega vanade salvestuste formaati ei asendatud. APK-d ei ehitatud.

Tõendid: qa-v72/report.json ning sama kausta ekraanipildid.
