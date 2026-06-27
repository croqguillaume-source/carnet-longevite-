exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY non configurée dans Netlify' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'JSON invalide' }) }; }

  const { prenom, email } = body;
  if (!prenom || !email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'prenom et email requis' }) };
  }

  const APP_URL = 'https://carnetlongevite.netlify.app';
  const texte = 'Salut ' + prenom + ',\n\n'
    + 'Ton accès à Carnet Longévité est prêt.\n\n'
    + '👉 ' + APP_URL + '\n\n'
    + "Crée ton compte avec cette adresse email et tu peux commencer directement. N'hésite pas à me faire un retour — je lis tout.\n\n"
    + 'Guillaume';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Guillaume · Carnet Longévité <welcome@carnetlongevite.fr>',
        to: [email],
        subject: 'Ton accès à Carnet Longévité est prêt 🌿',
        text: texte
      })
    });

    const data = await res.json();
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
