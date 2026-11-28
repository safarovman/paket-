# UzDrop — rasm yaratish uchun promptlar

Bu promptlarni rasm yaratadigan AI'ga (Google Flow / Imagen, Midjourney, ChatGPT va h.k.) bering.
Promptlar inglizcha — rasm AI'lari inglizchani yaxshiroq tushunadi.

Tayyor rasmlarni **aynan shu nomlar bilan** saqlang va GitHub'dagi papkaga yuklang
(yoki Claude'ga yuboring — u joylab beradi):
- Avatar: `gboost-web/public/mascot/`
- Ramkalar: `gboost-web/public/frames/`

Format: **PNG, shaffof fon (transparent background)**. Rasm yuklanmaguncha saytda
vaqtinchalik chizilgan avatar va ramkalar ko'rinadi — sayt buzilmaydi.

---

## 1-qism. Yangi chatga beriladigan asosiy xabar (nusxalab qo'ying)

```
I need a consistent set of character images for my gaming website "UzDrop"
(a marketplace for buying video game accounts). The site design is black background
with red (#DC2626 / #FF6B6B) and yellow (#FFC83D) accents.

CHARACTER (must look identical in every image):
A mysterious masked guide — a slim figure in a black hoodie with the hood up, wearing a
smooth white porcelain mask with thin glowing red eye slits and a subtle yellow "U" mark
on the forehead. Black gloves. Calm, confident, slightly villainous but friendly helper vibe.
Stylized semi-realistic 3D game-art style (like a modern game splash art), soft rim light
in red and yellow, high detail, clean edges.

TECHNICAL: PNG with fully transparent background, no text, no watermark, no frame,
character centered, full upper body visible, 1024x1024.

Generate these 5 poses, one image each, keeping the SAME character design:
1. desk.png — sitting behind a dark desk with a glowing laptop and a few game cards on it,
   hands folded, looking at the viewer (desk visible, still transparent background around).
2. point-right.png — standing, upper body, pointing with the right hand to the viewer's right side.
3. point-left.png — standing, upper body, pointing with the left hand to the viewer's left side.
4. wave.png — standing, upper body, waving hello with one hand.
5. think.png — standing, upper body, one hand on the mask's chin, thinking/explaining pose.
```

---

## 2-qism. O'yin ramkalari (har biri alohida so'rov)

Har bir ramka uchun shu umumiy qismni yozing, keyin o'yinga mos qatorni qo'shing:

```
Ornate decorative card frame for a gaming marketplace item card.
Vertical portrait 3:4 (768x1024), PNG with FULLY TRANSPARENT CENTER and transparent outside —
only the frame border is visible (border thickness about 6% of the width), detailed corners,
symmetrical, no text, no logo, no watermark, game-art style, glowing accents.
Style: <O'YIN QATORI>
```

| Fayl nomi | O'YIN QATORI (Style) |
|---|---|
| `frame-pubg.png` | military battle royale theme, worn gold and olive metal plates, rivets, ammo-belt details, golden glow |
| `frame-standoff2.png` | tactical shooter theme, brushed steel with bright orange hazard accents, sharp angled corners |
| `frame-mlbb.png` | fantasy MOBA theme, royal blue and gold ornate filigree, magic crystal gems in the corners |
| `frame-freefire.png` | fiery theme, dark metal with burning orange-red flames licking the edges, embers |
| `frame-cs2.png` | counter-terrorist tactical theme, dark gunmetal, orange accents, bullet-shell details |
| `frame-brawl.png` | cartoon theme, chunky pink and yellow comic-style frame with stars |
| `frame-default.png` | luxury black frame with red (#DC2626) and yellow (#FFC83D) neon edges, sleek |

---

## Fayllar ro'yxati (tekshirish uchun)

```
public/mascot/desk.png
public/mascot/point-right.png
public/mascot/point-left.png
public/mascot/wave.png
public/mascot/think.png
public/frames/frame-pubg.png
public/frames/frame-standoff2.png
public/frames/frame-mlbb.png
public/frames/frame-freefire.png
public/frames/frame-cs2.png
public/frames/frame-brawl.png
public/frames/frame-default.png
```

Maslahat: rasmlarni yuklashdan oldin https://tinypng.com orqali siqing — sayt tezroq ochiladi.
