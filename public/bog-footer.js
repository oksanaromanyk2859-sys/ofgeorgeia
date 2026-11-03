(function () {
  if (document.querySelector('.pb-footer')) return;

  var isEN = (document.documentElement.lang || '').toLowerCase().startsWith('en');

  var css = ''
    + '.pb-footer{background:#f7f7f7;padding:0;margin-top:28px;font-size:13px;color:#444;border-top:3px solid #FDA811;font-family:"Noto Sans Georgian","Segoe UI",Tahoma,Arial,sans-serif}'
    + '.pb-footer .ft-content{padding:32px 16px 0;max-width:520px;margin:0 auto}'
    + '.pb-footer .ft-phones{margin-bottom:24px}'
    + '.pb-footer .ft-phone-row{display:flex;align-items:center;gap:14px;margin-bottom:24px}'
    + '.pb-footer .ft-phone-row img{width:44px;height:44px;flex-shrink:0;object-fit:contain}'
    + '.pb-footer .ft-phone-row .call-info .header{font-size:20px;font-weight:700;color:#1a1a1a;margin:0}'
    + '.pb-footer .ft-phone-row .call-info .description{font-size:13px;color:#888;margin:2px 0 0}'
    + '.pb-footer .ft-phone-row:last-child{margin-bottom:0}'
    + '.pb-footer .ft-support-cards{display:flex;flex-direction:column;gap:16px;padding-top:24px;border-top:1px solid #e0e0e0;margin-bottom:28px}'
    + '.pb-footer .ft-support-card{display:flex;align-items:center;gap:14px}'
    + '.pb-footer .ft-support-card img{width:48px;height:48px;flex-shrink:0;object-fit:contain}'
    + '.pb-footer .ft-support-card .card-info{flex:1}'
    + '.pb-footer .ft-support-card .card-info p{font-size:15px;color:#1a1a1a;margin:0 0 6px;font-weight:600}'
    + '.pb-footer .ft-support-card .card-info a{display:inline-block;padding:8px 22px;border:1.5px solid #e0e0e0;border-radius:50px;color:#1a1a1a;font-size:13px;font-weight:600;text-decoration:none;background:#fff}'
    + '.pb-footer .ft-col{margin-bottom:24px}'
    + '.pb-footer .ft-col .sub-header{font-size:13px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px}'
    + '.pb-footer .ft-col ul{list-style:none;padding:0;margin:0}'
    + '.pb-footer .ft-col ul li{margin-bottom:10px}'
    + '.pb-footer .ft-col ul a{color:#555;text-decoration:none;font-size:14px;line-height:1.5}'
    + '.pb-footer .ft-sites{margin-bottom:28px}'
    + '.pb-footer .ft-sites .sub-header{font-size:13px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px}'
    + '.pb-footer .bog-apps{display:flex;flex-direction:column;gap:10px}'
    + '.pb-footer .bog-apps a{display:block}'
    + '.pb-footer .bog-apps img{height:44px;display:block}'
    + '.pb-footer .ft-note{padding:24px 16px 28px;border-top:1px solid #e0e0e0;max-width:520px;margin:0 auto}'
    + '.pb-footer .ft-note-inner{display:flex;flex-direction:column;gap:20px}'
    + '.pb-footer .ft-social{display:flex;gap:20px;flex-wrap:wrap}'
    + '.pb-footer .ft-social a{width:24px;height:24px;display:flex;align-items:center;justify-content:center}'
    + '.pb-footer .ft-social a svg{width:24px;height:24px}'
    + '.pb-footer .ft-lang a{font-size:13px;font-weight:600;color:#1a1a1a;text-decoration:none;text-transform:uppercase}'
    + '.pb-footer .ft-privacy a{color:#555;text-decoration:none;font-size:13px}'
    + '.pb-footer .ft-licence{font-size:11px;color:#999;line-height:1.5}';

  var fbSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M24 12.073C24 5.40365 18.629 0 12 0C5.37097 0 0 5.40365 0 12.073C0 18.0988 4.38823 23.0936 10.125 24V15.563H7.07662V12.073H10.125V9.41306C10.125 6.38751 11.9153 4.71627 14.6574 4.71627C15.9707 4.71627 17.3439 4.95189 17.3439 4.95189V7.92146H15.8303C14.34 7.92146 13.875 8.85225 13.875 9.80689V12.073H17.2031L16.6708 15.563H13.875V24C19.6117 23.0936 24 18.0988 24 12.073Z" fill="black" fill-opacity="0.5"/></svg>';
  var igSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07c-1.28.06-2.15.26-2.91.56-.79.3-1.46.72-2.13 1.39S.74 3.35.44 4.14C.14 4.9-.06 5.77 0 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.28.26 2.15.56 2.91.3.79.72 1.46 1.39 2.13s1.34 1.09 2.13 1.39c.76.3 1.63.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.28-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.13-1.39s1.09-1.34 1.39-2.13c.3-.76.5-1.63.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.28-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.39-2.13S20.65.74 19.86.44C19.1.14 18.23-.06 16.95 0 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 005.84 12 6.16 6.16 0 0012 18.16 6.16 6.16 0 0018.16 12 6.16 6.16 0 0012 5.84zm0 10.16A4 4 0 018 12a4 4 0 014-4 4 4 0 014 4 4 4 0 01-4 4zm6.4-11.84a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" fill="black" fill-opacity="0.5"/></svg>';
  var ytSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M23.5 6.5a3 3 0 00-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 00.5 6.5C.1 8.4.1 12 .1 12s0 3.6.4 5.5a3 3 0 002.1 2.1C4.5 20 12 20 12 20s7.5 0 9.4-.4a3 3 0 002.1-2.1c.4-1.9.4-5.5.4-5.5s0-3.6-.4-5.5zM9.6 15.6V8.4L15.8 12l-6.2 3.6z" fill="black" fill-opacity="0.5"/></svg>';
  var liSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M21.3 1H1.7C.8 1 0 1.74 0 2.66v19.68C0 23.26.52 24 1.46 24H21.06c.94 0 1.94-.74 1.94-1.66V2.66C23 1.74 22.27 1 21.3 1zM8.76 9.76h3.1v1.58h.04c.47-.85 1.87-1.72 3.59-1.72 3.3 0 4.22 1.76 4.22 5.01V20.7H16.4v-5.48c0-1.46-.58-2.74-1.94-2.74-1.65 0-2.44 1.12-2.44 2.95V20.7H8.76V9.76zm-5.48 10.96h3.3V9.76h-3.3V20.7zM7 5.93a2.05 2.05 0 11-4.11 0 2.05 2.05 0 014.11 0z" fill="black" fill-opacity="0.5"/></svg>';

  var txt = isEN ? {
    hotline: 'Hotline — free call from Georgia',
    international: 'For calls from abroad / landlines',
    questions: 'Questions &amp; suggestions',
    writeUs: 'Write us',
    publicAgreements: 'Public agreements',
    learnMore: 'Learn more',
    bank: 'The Bank',
    bankLinks: ['About us', 'Branches', 'ATMs', 'Careers', 'Press center', 'Terms &amp; conditions'],
    services: 'Services',
    servicesLinks: ['iBank', 'Loans', 'Deposits', 'Cards', 'Transfers', 'Exchange rates'],
    download: 'Download the app',
    langHref: '/index.html',
    langLabel: 'KA',
    privacy: 'Personal data protection',
    licence: ' JSC Bank of Georgia. National Bank of Georgia License No. 36. Address: 29a Gagarini St., Tbilisi 0160',
    hotlineAlt: 'Hotline',
    internationalAlt: 'International',
    questionsAlt: 'Questions',
    agreementsAlt: 'Public agreements',
    bogSite: 'https://bankofgeorgia.ge/en',
  } : {
    hotline: 'ცხელი ხაზი — ზარი უფასოა საქართველოდან',
    international: 'ზარები საერთაშორისო ხაზებიდან',
    questions: 'კითხვები და წინადადებები',
    writeUs: 'მოგვწერეთ',
    publicAgreements: 'საჯარო ხელშეკრულებები',
    learnMore: 'გაიგეთ მეტი',
    bank: 'ბანკი',
    bankLinks: ['ჩვენ შესახებ', 'ფილიალები', 'ბანკომატები', 'კარიერა', 'პრესცენტრი', 'წესები და პირობები'],
    services: 'სერვისები',
    servicesLinks: ['iBank', 'სესხები', 'დეპოზიტები', 'ბარათები', 'გადარიცხვები', 'ვალუტის კურსი'],
    download: 'ჩამოტვირთე აპი',
    langHref: '/en/index.html',
    langLabel: 'EN',
    privacy: 'პერსონალური მონაცემების დაცვა',
    licence: ' სსიპ „საქართველოს ბანკი". ეროვნული ბანკის ლიცენზია №36. მის.: გაგარინის ქ. 29ა, თბილისი 0160',
    hotlineAlt: 'ცხელი ხაზი',
    internationalAlt: 'საერთაშორისო',
    questionsAlt: 'კითხვები',
    agreementsAlt: 'საჯარო ხელშეკრულებები',
    bogSite: 'https://bankofgeorgia.ge/',
  };

  function li(label) {
    return '<li><a href="' + txt.bogSite + '" target="_blank" rel="noopener">' + label + '</a></li>';
  }

  var html = '<footer class="pb-footer">'
    + '<div class="ft-content">'
      + '<div class="ft-phones">'
        + '<div class="ft-phone-row">'
          + '<img src="https://cdn-icons-png.flaticon.com/128/724/724664.png" alt="' + txt.hotlineAlt + '">'
          + '<div class="call-info"><p class="header">*2727</p><p class="description">' + txt.hotline + '</p></div>'
        + '</div>'
        + '<div class="ft-phone-row">'
          + '<img src="https://cdn-icons-png.flaticon.com/128/9850/9850809.png" alt="' + txt.internationalAlt + '">'
          + '<div class="call-info"><p class="header">+995 32 2 444 444</p><p class="description">' + txt.international + '</p></div>'
        + '</div>'
      + '</div>'
      + '<div class="ft-support-cards">'
        + '<div class="ft-support-card">'
          + '<img src="https://cdn-icons-png.flaticon.com/128/9068/9068699.png" alt="' + txt.questionsAlt + '">'
          + '<div class="card-info"><p>' + txt.questions + '</p><a href="mailto:customerservice@bog.ge">' + txt.writeUs + '</a></div>'
        + '</div>'
        + '<div class="ft-support-card">'
          + '<img src="https://cdn-icons-png.flaticon.com/128/3135/3135755.png" alt="' + txt.agreementsAlt + '">'
          + '<div class="card-info"><p>' + txt.publicAgreements + '</p><a href="' + txt.bogSite + '" target="_blank" rel="noopener">' + txt.learnMore + '</a></div>'
        + '</div>'
      + '</div>'
      + '<div class="ft-col"><p class="sub-header">' + txt.bank + '</p><ul>' + txt.bankLinks.map(li).join('') + '</ul></div>'
      + '<div class="ft-col"><p class="sub-header">' + txt.services + '</p><ul>' + txt.servicesLinks.map(li).join('') + '</ul></div>'
      + '<div class="ft-sites">'
        + '<p class="sub-header">' + txt.download + '</p>'
        + '<div class="bog-apps">'
          + '<a href="https://play.google.com/store/apps/details?id=ge.bog.mobilebank" target="_blank" rel="noopener"><img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play"></a>'
          + '<a href="https://apps.apple.com/ge/app/bank-of-georgia/id1115367026" target="_blank" rel="noopener"><img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store"></a>'
          + '<a href="https://appgallery.huawei.com/" target="_blank" rel="noopener"><img src="https://upload.wikimedia.org/wikipedia/commons/9/9e/Huawei_AppGallery_Badge_Black_EN.svg" alt="AppGallery"></a>'
        + '</div>'
      + '</div>'
    + '</div>'
    + '<div class="ft-note"><div class="ft-note-inner">'
      + '<div class="ft-social">'
        + '<a href="https://www.facebook.com/BankofGeorgia" target="_blank" rel="noopener" aria-label="Facebook">' + fbSvg + '</a>'
        + '<a href="https://www.instagram.com/bankofgeorgia/" target="_blank" rel="noopener" aria-label="Instagram">' + igSvg + '</a>'
        + '<a href="https://www.youtube.com/@bankofgeorgia" target="_blank" rel="noopener" aria-label="YouTube">' + ytSvg + '</a>'
        + '<a href="https://www.linkedin.com/company/bank-of-georgia/" target="_blank" rel="noopener" aria-label="LinkedIn">' + liSvg + '</a>'
      + '</div>'
      + '<div class="ft-lang"><a href="' + txt.langHref + '">' + txt.langLabel + '</a></div>'
      + '<div class="ft-privacy"><a href="' + txt.bogSite + '" target="_blank" rel="noopener">' + txt.privacy + '</a></div>'
      + '<div class="ft-licence">&copy; ' + new Date().getFullYear() + txt.licence + '</div>'
    + '</div></div></footer>';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap.firstChild);
})();
