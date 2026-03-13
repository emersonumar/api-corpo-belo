const express = require('express');
const axios = require('axios');
const https = require('https');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const agent = new https.Agent({
  cert: process.env.INTER_CERT,
  key: process.env.INTER_KEY,
});

app.post('/emitir-boleto', async (req, res) => {
  try {
    const authRes = await axios.post('https://cdpj.partners.bancointer.com.br/oauth/v2/token', 
      new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'boleto-cobranca.read boleto-cobranca.write'
      }),
      { httpsAgent: agent, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const boleto = await axios.post('https://cdpj.partners.bancointer.com.br/cobranca/v3/boletos', 
      req.body, 
      { httpsAgent: agent, headers: { Authorization: `Bearer ${authRes.data.access_token}` } }
    );

    res.json(boleto.data);
  } catch (err) {
    res.status(500).json(err.response?.data || { error: err.message });
  }
});

app.listen(process.env.PORT || 3000);
