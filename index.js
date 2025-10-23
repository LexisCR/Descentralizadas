const express = require('express');
const app = express();
const bodyParser = require('body-parser');

//const userRoutes = require('./routes/user');
const walletRoutes = require('./routes/wallet');
const pagosRoutes = require('./routes/pagos');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/pagos', pagosRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server at port ${PORT}`));