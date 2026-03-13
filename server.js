const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Rota de teste para saber se o servidor está online
app.get('/', (req, res) => {
  res.send('API Corpo Belo Online!');
});

// Sua rota de emissão
app.post('/emitir-boleto', async (req, res) => {
  console.log('Recebendo pedido de boleto...', req.body);
  try {
    // Aqui vai a lógica que você já tem com o Banco Inter...
    // Certifique-se de que as variáveis process.env.CLIENT_ID etc. estão sendo usadas.
    
    res.json({ mensagem: "Processando boleto no Render!" });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});