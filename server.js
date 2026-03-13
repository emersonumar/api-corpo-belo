const express = require('express');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// --- CONFIGURAÇÃO DOS CERTIFICADOS (RENDER) ---
// Criamos arquivos temporários a partir das variáveis de ambiente
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

// --- ROTA DE TESTE ---
app.get('/', (req, res) => {
    res.send('API Corpo Belo Online e Pronta!');
});

// --- ROTA DE EMISSÃO DE BOLETO ---
app.post('/emitir-boleto', async (req, res) => {
    console.log('Recebendo pedido de boleto para:', req.body.pagador?.nome);

    try {
        // 1. Obter Token de Acesso do Banco Inter
        const tokenResponse = await axios.post(
            'https://cdpj.itau.com.br/oauth/token', // Verifique se é a URL do Inter ou Itaú (ajustei para Inter abaixo)
            'grant_type=client_credentials&scope=boleto-repshop.read boleto-repshop.write',
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                httpsAgent: httpsAgent,
                auth: {
                    username: process.env.CLIENT_ID,
                    password: process.env.CLIENT_SECRET
                }
            }
        );

        // Se a URL acima for do Inter, geralmente é: https://cdpj.inter.co/oauth/v2/token
        // Ajuste a URL de acordo com o manual que você recebeu.

        const accessToken = tokenResponse.data.access_token;

        // 2. Enviar dados para o Banco Inter (Exemplo de estrutura)
        // Aqui você deve mapear os dados que o Lovable envia (req.body) para o formato do Inter
        const boletoData = {
            pagador: req.body.pagador,
            valorNominal: req.body.valor,
            dataVencimento: "2026-03-20", // Ideal vir do req.body
            numDiasAgenda: 30
        };

        /* const interResponse = await axios.post(
            'https://cdpj.inter.co/cobranca/v2/boletos',
            boletoData,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
                httpsAgent: httpsAgent
            }
        );
        */

        res.json({ 
            sucesso: true, 
            mensagem: "Conexão com Banco Inter estabelecida!",
            debug: "Token obtido com sucesso. Pronto para emitir."
        });

    } catch (error) {
        console.error('Erro detalhado:', error.response?.data || error.message);
        res.status(500).json({
            erro: "Falha na comunicação com o Banco Inter",
            detalhes: error.response?.data || error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Servidor Corpo Belo rodando na porta ${port}`);
});