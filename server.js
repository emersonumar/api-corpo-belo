const express = require('express');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// --- CONFIGURAÇÃO DOS CERTIFICADOS ---
const certPath = path.join('/tmp', 'inter_cert.pem');
const keyPath = path.join('/tmp', 'inter_key.key');

if (process.env.INTER_CERT && process.env.INTER_KEY) {
    fs.writeFileSync(certPath, process.env.INTER_CERT);
    fs.writeFileSync(keyPath, process.env.INTER_KEY);
}

const httpsAgent = new https.Agent({
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
});

app.get('/', (req, res) => res.send('API Corpo Belo Online!'));

app.post('/emitir-boleto', async (req, res) => {
    console.log('Solicitando token ao Banco Inter...');
    try {
        // URL OFICIAL DO BANCO INTER PARA TOKEN
        const tokenResponse = await axios.post(
            'https://cdpj.inter.co/oauth/v2/token',
            'grant_type=client_credentials&scope=boleto-cobranca.read boleto-cobranca.write',
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                httpsAgent: httpsAgent,
                auth: {
                    username: process.env.CLIENT_ID,
                    password: process.env.CLIENT_SECRET
                }
            }
        );

        res.json({ 
            sucesso: true, 
            mensagem: "Conectado ao Banco Inter!",
            token: "Token obtido com sucesso!" 
        });

    } catch (error) {
        console.error('Erro no Inter:', error.response?.data || error.message);
        res.status(500).json({
            erro: "Erro na comunicação com o Banco Inter",
            detalhes: error.response?.data || error.message
        });
    }
});

app.listen(port, () => console.log(`Rodando na porta ${port}`));