export function adErrorMessage(error, language='en') {
  const code=error.code||error.message;
  const messages={
    OFFLINE:['Connect to the internet to watch an ad.','Reklaami vaatamiseks ühendu internetiga.'],
    TIMEOUT:['Video loading timed out. Try another network or try later.','Video laadimine aegus. Proovi teist võrku või hiljem uuesti.'],
    EMPTY_RESPONSE:['Start.io returned an empty response (HTTP 204). Check the app configuration and ad availability in Start.io.','Start.io tagastas tühja vastuse (HTTP 204). Kontrolli Start.io äpi seadistust ja reklaamide saadavust.'],
    NO_AD:['No video available right now. Try again later.','Praegu pole videot saadaval. Proovi hiljem uuesti.'],
    NO_FILL:['Start.io returned NO FILL: no video was supplied for this request.','Start.io vastas NO FILL: sellele päringule videot ei pakutud.'],
    NETWORK_ERROR:['Start.io could not connect. Check your network, VPN, ad blocker or private DNS.','Start.io ühendus ebaõnnestus. Kontrolli võrku, VPN-i, reklaamiblokeerijat või privaatset DNS-i.'],
    CONFIG_ERROR:['Start.io reported an app configuration error. Open ad diagnostics below.','Start.io teatas äpi seadistuse veast. Ava all reklaami diagnostika.'],
    INIT_FAILED:['The ad SDK failed to initialise. Open ad diagnostics below.','Reklaami SDK käivitamine ebaõnnestus. Ava all reklaami diagnostika.'],
    SHOW_FAILED:['The video could not be displayed. Open ad diagnostics below.','Videot ei saanud kuvada. Ava all reklaami diagnostika.'],
    DISABLED:['Video ads are disabled. Check ad preferences.','Videoreklaamid on välja lülitatud. Kontrolli reklaamiseadeid.'],
    BUSY:['A video request is already running.','Video päring juba käib.'],
    CANCELLED:['Video request was interrupted. No REP was added.','Videopäring katkes. REP-i ei lisatud.'],
  };
  return (messages[code]||['Video loading failed. Open ad diagnostics below.','Video laadimine ebaõnnestus. Ava all reklaami diagnostika.'])[language==='et'?1:0];
}
