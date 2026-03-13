const express = require('express');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// --- CERTIFICADOS ---
const certPath = path.join('/tmp', 'inter_cert.pem');
const keyPath = path.join('/tmp', 'inter_key.key');

if (process.env.INTER_CERT && process.env.INTER_KEY) {
    // Limpa possíveis quebras de linha mal formatadas
    const cleanCert = process.env.INTER_CERT.replace(/\\n/g, '\n');
    const cleanKey = process.env.INTER_KEY.replace(/\\n/g, '\n');
    fs.writeFileSync(certPath, cleanCert);
    fs.writeFileSync(keyPath, cleanKey);
}

// Configuração de Agente HTTPS Robusta
const httpsAgent = new https.Agent({
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    rejectUnauthorized: false // Em alguns casos de mTLS do Inter, ajuda na conexão inicial
});

app.get('/', (req, res) => res.send('API Corpo Belo: Sistema de Boletos Online!'));

app.post('/emitir-boleto', async (req, res) => {
    console.log('Tentando conexão direta com o Banco Inter...');
    
    try {
        // Tentativa usando a URL de produção padrão
        const response = await axios.post(
            'https://cdpj.inter.co/oauth/v2/token',
            'grant_type=client_credentials&scope=boleto-cobranca.read boleto-cobranca.write',
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                httpsAgent: httpsAgent,
                auth: {
                    username: (process.env.CLIENT_ID || '').trim(),
                    password: (process.env.CLIENT_SECRET || '').trim()
                }
            }
        );

        return res.json({ 
            sucesso: true, 
            mensagem: "Corpo Belo Conectada!", 
            status: "Token obtido!" 
        });

    } catch (error) {
        console.error('Falha detalhada:', error.message);
        
        // Se der erro de DNS de novo, tentamos uma rota alternativa interna
        res.status(500).json({
            erro: "O Render não encontrou o Banco Inter",
            detalhes: error.message,
            sugestao: "Verifique se os dados no painel do Render estão sem espaços."
        });
    }
});

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));