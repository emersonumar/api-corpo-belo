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
    console.log('Solicitando acesso ao Banco Inter...');
    try {
        // URL CORRETA PARA O TOKEN (Muitas vezes é cdpt.inter.co ou apenas inter.co)
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
        ).catch(err => {
            // Se der erro de DNS, tentamos a URL alternativa
            return axios.post(
                'https://cdpj-cobranca.inter.co/oauth/v2/token',
                'grant_type=client_credentials&scope=boleto-cobranca.read boleto-cobranca.write',
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    httpsAgent: httpsAgent,
                    auth: { username: process.env.CLIENT_ID, password: process.env.CLIENT_SECRET }
                }
            );
        });

        res.json({ 
            sucesso: true, 
            mensagem: "Corpo Belo Conectada!",
            token: "Acesso autorizado pelo Banco Inter." 
        });

    } catch (error) {
        console.error('Erro de Conexão:', error.message);
        res.status(500).json({
            erro: "Erro de DNS ou Conexão no Banco Inter",
            detalhes: error.message,
            ajuda: "Verifique se o CLIENT_ID e SECRET estão corretos no Render."
        });
    }
});

app.listen(port, () => console.log(`Rodando na porta ${port}`));