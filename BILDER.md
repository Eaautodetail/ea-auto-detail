# Bilder på hemsidan – så byter och lägger du till

Den här guiden är skriven för dig som inte är utvecklare. Du behöver bara en webbläsare och inloggning till GitHub.
Allt görs i två steg:

1. **Ladda upp bildfilen** till rätt mapp i projektet på GitHub.
2. **Tala om för sajten att bilden finns** genom att ändra en rad i filen `src/config/site.ts`.

När du sparar (gör en *commit*) bygger Vercel om sajten automatiskt. Efter några minuter syns ändringen på hemsidan.

| Vad | Mapp för bildfilen | Vad du ändrar i `src/config/site.ts` |
| --- | --- | --- |
| Före- och efterbilder (galleriet) | `public/gallery/` | Listan `gallery: [ ... ]` |
| Stor bild högst upp på startsidan | `public/images/` | Raden `heroImage:` |
| Logotyp | `public/images/` | Raden `logo:` |
| Foto på er på sidan Om oss | `public/images/` | En ny rad `aboutImage:` |

---

## 1. Förbered bilderna

- **Bara egna bilder.** Visa aldrig någon annans bilder som ert jobb.
- **Format:** JPG fungerar bäst (PNG och WEBP går också bra).
- **Storlek:** ungefär 1200–1600 pixlar på den längsta sidan räcker. Försök hålla varje fil under ca 500 kB
  (max ca 1 MB). Stora bilder gör sidan långsammare. Du kan förminska bilder gratis på t.ex. squoosh.app.
- **Före och efter:** ta bilderna från **samma vinkel** och i **samma format** (båda stående eller båda liggande).
  Galleriet anpassar sig automatiskt efter bildens format – vanliga stående mobilbilder (3:4) fungerar utmärkt.
- **Filnamn:** små bokstäver, inga mellanslag och inga å, ä eller ö. Använd bindestreck.
  Bra: `volvo-v60-fore.jpg`, `volvo-v60-efter.jpg`. Dåligt: `Före bild (1).JPG`.
  Obs! Stora och små bokstäver räknas: `Bild.JPG` och `bild.jpg` är två olika filer.
- **Integritet:** syns registreringsskylt, personer eller hus/adress? Fråga kunden först eller sudda ut det.

---

## 2. Ladda upp en bild till GitHub

1. Gå till projektet på GitHub (t.ex. `github.com/Eaautodetail/ea-auto-detail`) och logga in.
2. Kontrollera att du står på den gren som sajten publiceras från – oftast **`main`** (knappen uppe till vänster
   ovanför fillistan).
3. Klicka dig in i mappen **`public`** och sedan **`gallery`** (för galleribilder) eller **`images`** (för
   hero-bild, logotyp och Om oss-foto).
4. Klicka på **Add file → Upload files**.
5. Dra in bildfilerna (eller klicka *choose your files*).
6. Skriv en kort beskrivning under *Commit changes*, t.ex. `Lägg till bilder Volvo V60`.
7. Välj **Commit directly to the main branch** och klicka på **Commit changes**.

Bilden ligger nu på servern men syns inte förrän du har gjort steg 3, 4, 5 eller 6 nedan.

> Adressen till bilden är mappnamnet **utan** `public`. En fil i `public/gallery/volvo-v60-fore.jpg` heter alltså
> `/gallery/volvo-v60-fore.jpg` i `site.ts`.

---

## 3. Lägg till ett jobb i galleriet (före och efter)

1. Ladda upp före- och efterbilden till `public/gallery/` (se steg 2).
2. Öppna filen **`src/config/site.ts`** på GitHub och klicka på **pennan** (*Edit this file*) uppe till höger.
3. Tryck **Ctrl + F** (Mac: **Cmd + F**) och sök efter `gallery: [`.
4. Klistra in mallen nedan på en ny rad **direkt efter** `gallery: [` och ändra texterna:

```ts
    {
      id: "volvo-v60-invandig",
      title: "Invändig rengöring",
      category: "interior",
      vehicle: "Volvo V60",
      serviceId: "interior",
      before: { src: "/gallery/volvo-v60-fore.jpg", alt: "Volvo V60 – framsäte före invändig rengöring" },
      after: { src: "/gallery/volvo-v60-efter.jpg", alt: "Volvo V60 – framsäte efter invändig rengöring" },
      placeholder: false,
    },
```

5. Klicka på **Commit changes…**, skriv t.ex. `Nytt jobb i galleriet` och klicka **Commit changes** igen.

Vad fälten betyder:

| Fält | Vad du skriver |
| --- | --- |
| `id` | Ett unikt namn för jobbet, små bokstäver och bindestreck. Får inte finnas två gånger. |
| `title` | Rubriken under bilden, t.ex. `"Utvändig tvätt"`. |
| `category` | `"interior"` (invändigt) eller `"exterior"` (utvändigt). Styr filtret i galleriet. |
| `vehicle` | Bilmodellen, t.ex. `"Volvo V60"`. Vill du inte visa modellen: skriv `null` (utan citattecken). |
| `serviceId` | Vilken tjänst det var: `"exterior"`, `"interior"` eller `"complete"` (in- och utvändigt). |
| `before` / `after` | `src` = bildens adress (se rutan ovan). `alt` = en kort beskrivning av bilden för synskadade och Google. |
| `placeholder` | Ska vara `false` för riktiga bilder. `true` betyder exempelbild och märks som "Exempel" på sidan. |
| `note` | *Valfritt.* En kort rad om jobbet, t.ex. `note: "Mycket hundhår i baksätet.",` |

Tips:

- Det jobb som ligger **först** i listan visas först. De tre första visas också på startsidan (två på mobil och surfplatta).
- Var noga med **kommatecken** och **citattecken** – kopiera hela mallen inklusive `{` och `},`.

### Exempelbilderna är redan borttagna

Galleriet visar nu era egna bilder (svart bil utvändigt, framsäte, baksäte och skåpbilens lastutrymme), och de
tillfälliga exempelbilderna är borttagna ur `gallery`-listan. Filerna `placeholder-*.svg` i `public/gallery/`
används inte längre och kan raderas (öppna filen på GitHub → de tre prickarna → *Delete file*).

Om ett jobb någon gång läggs in med `placeholder: true` märks det som "Exempel" på sidan, och det döljs helt när
`showPlaceholders` sätts till `false` i `site.ts` inför publicering.

---

## 4. Byt den stora bilden högst upp på startsidan (hero)

Utan egen bild visas en ritad grafik av en bil.

1. Välj en **liggande** bild, gärna minst 2000 pixlar bred. Texten ligger till vänster och bilden mörkas där, så
   motivet (bilen) gör sig bäst till höger i bilden.
2. Ladda upp den till `public/images/`, t.ex. som `hero.jpg`.
3. Öppna `src/config/site.ts` → pennan → sök efter `heroImage:`.
4. Ändra raden

```ts
  heroImage: null as null | { src: string; alt: string },
```

till (byt bara ut `null` i början – låt resten av raden vara kvar):

```ts
  heroImage: { src: "/images/hero.jpg", alt: "Nytvättad svart bil i solljus" } as null | { src: string; alt: string },
```

5. Commit changes.

---

## 5. Byt logotyp

Utan logotypfil visas en textlogga ("EA Auto Detail").

1. Använd en logga med **genomskinlig bakgrund** (PNG eller SVG) och **ljus/vit** färg – sajten är mörk.
2. Ladda upp den till `public/images/`, t.ex. som `logo.png`.
3. Ta reda på bildens storlek i pixlar (Windows: högerklicka → *Egenskaper* → *Information*. Mac: öppna i
   Förhandsvisning → *Verktyg* → *Visa inspektör*).
4. Öppna `src/config/site.ts` → pennan → sök efter `logo:` och ändra raden

```ts
  logo: null as null | { src: string; width: number; height: number },
```

till (med din bilds bredd och höjd):

```ts
  logo: { src: "/images/logo.png", width: 400, height: 120 } as null | { src: string; width: number; height: number },
```

5. Commit changes. Loggan visas automatiskt i menyn och i sidfoten.

---

## 6. Foto på er till sidan Om oss

1. Välj ett **stående** foto (ungefär 4:5), t.ex. på er två framför en bil ni har tvättat.
2. Ladda upp det till `public/images/`, t.ex. som `om-oss.jpg`.
3. Öppna `src/config/site.ts` → pennan → sök efter `heroImage:`.
4. Lägg till en **ny rad direkt under** `heroImage`-raden:

```ts
  aboutImage: { src: "/images/om-oss.jpg", alt: "Grundarna av EA Auto Detail framför en nytvättad bil" },
```

5. Commit changes. Fotot ersätter då den grå rutan med "EA" på sidan Om oss.

---

## 7. Kontrollera att allt fungerar

- På GitHub syns en **gul prick** bredvid din ändring medan Vercel bygger, en **grön bock** när det är klart och ett
  **rött kryss** om något blev fel.
- Öppna hemsidan och ladda om sidan (ibland behövs Ctrl + F5 / Cmd + Shift + R).

**Rött kryss?** Vanligaste orsakerna:

- Ett kommatecken eller citattecken saknas i `site.ts`. Jämför med mallen ovan.
- Filnamnet i `site.ts` stämmer inte exakt med filen (stora/små bokstäver, `.jpg` eller `.jpeg`).
- Bilden ligger i fel mapp.

Du kan alltid ångra: öppna `site.ts` på GitHub → **History** → välj den senaste fungerande versionen och kopiera
tillbaka texten, eller rätta felet och gör en ny commit. Sajten fortsätter att visa den senaste fungerande versionen
tills felet är rättat.

---

## Bra att veta

- Delningsbilden som visas när någon delar hemsidan på t.ex. Facebook skapas automatiskt – den behöver du inte göra.
- Vill du hellre slippa göra det själv? Skicka bilderna och en rad om varje jobb (bil, tjänst, invändigt/utvändigt)
  till den som hjälper er med sajten, så läggs de in på samma sätt.
