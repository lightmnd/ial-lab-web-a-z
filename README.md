In questo scenario non ci sono problemi di cookie, CSRF o backend Node/Express: le vulnerabilità si concentrano sul **campo input** e sul modo in cui i dati esterni (API) vengono mostrati nel DOM.

---

## 🔎 Vulnerabilità principali nel codice

1. **XSS (Cross-Site Scripting) via campo città**

   * Anche se usi `textContent` per inserire il nome della città (`cityName.textContent = ...`), altrove manipoli direttamente `className` e potresti inavvertitamente concatenare stringhe non validate in attributi (`weatherIcon.className = ...`).
   * Inoltre la fetch a `https://geocode.xyz/${city}?json=1` inserisce l’input direttamente nell’URL, senza encoding: qualcuno può scrivere `Milano<script>` e causare un request malformato o un comportamento anomalo.

2. **Injection nell’URL della fetch (Geocode API)**

   * L’input dell’utente è usato per costruire l’URL, senza `encodeURIComponent()`.
   * Questo può causare richieste errate o sfruttabili in combinazione con bug della terza parte (open redirect, SSRF se lato server, ecc.).

3. **Mancanza di validazione lato client**

   * Non c’è controllo sul formato della città: l’utente può inserire qualunque stringa, anche molto lunga.
   * Questo apre la strada a denial of service (input eccessivo → errori della API).

4. **Gestione errori insufficiente**

   * Se `geocode.xyz` risponde con valori imprevisti (o manipolati), accedi a `data.latt` e `data.longt` senza validazione. Potresti finire a costruire un URL con `undefined` o valori malevoli.

5. **Mancanza di Content Security Policy (CSP)**

   * La pagina non ha protezione di base contro esecuzione di script iniettati (ad es. tramite estensioni, CDN compromessi).

6. **Dipendenza da API di terze parti non autenticata**

   * Non c’è controllo sul certificato/endpoint (usando HTTPS sei parzialmente protetto, ma se geocode.xyz cambiasse comportamento, sei vulnerabile).

---

## 🛠️ Patch / Soluzioni

### 1. Sanificazione e encoding input

Quando usi input in URL:

```js
const response = await fetch(`https://geocode.xyz/${encodeURIComponent(city)}?json=1`);
```

→ impedisce injection nell’URL.

### 2. Validazione input lato client

```js
if (!/^[a-zA-Z\s]{1,50}$/.test(city)) {
    errorMessage.textContent = "Nome città non valido.";
    return;
}
```

→ accetta solo lettere e spazi, max 50 caratteri.

### 3. Evitare concatenazioni pericolose

Quando modifichi `className`, usa `.classList`:

```js
weatherIcon.className = "weather-icon fas"; // reset
weatherIcon.classList.add(iconClass);
```

→ impedisce injection via stringa.

### 4. Rafforzare la gestione errori

```js
if (!latt || !longt || isNaN(Number(latt)) || isNaN(Number(longt))) {
    errorMessage.textContent = "Coordinate non valide restituite dal servizio.";
    hideLoading();
    return;
}
```

### 5. Content Security Policy

In `index.html`, dentro `<head>`:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' https://cdnjs.cloudflare.com; connect-src 'self' https://geocode.xyz https://api.open-meteo.com;">
```

→ limita risorse solo a fonti attese.

### 6. Rate limiting lato client (base)

Non potendo controllare il server, puoi solo evitare spam di chiamate:

```js
let lastSearch = 0;
searchBtn.addEventListener("click", () => {
    const now = Date.now();
    if (now - lastSearch < 3000) { // 3 secondi
        errorMessage.textContent = "Attendi prima di cercare di nuovo.";
        return;
    }
    lastSearch = now;
    // ... resto del codice
});
```

---

## 📋 Elenco Vulnerabilità + Patch (riassunto)

| Vulnerabilità                                | Descrizione                                    | Patch                                                    |
| -------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| XSS potenziale via input e manipolazione DOM | Input non sanificato, uso diretto di className | Usare `textContent`, `classList`, validare input         |
| Injection nell’URL della fetch               | Input concatenato senza encoding               | Usare `encodeURIComponent(city)`                         |
| Nessuna validazione input                    | Città può contenere payload arbitrari          | Regex / controlli lunghezza                              |
| Error handling debole                        | API può restituire valori inattesi             | Controllare `latt`, `longt`, `weatherData`               |
| Mancanza CSP                                 | Possibile esecuzione script non autorizzati    | Aggiungere meta tag CSP in `index.html`                  |
| API non controllate                          | Rischio se endpoint cambia o è compromesso     | Limitare `connect-src` con CSP, considerare proxy sicuro |

---

