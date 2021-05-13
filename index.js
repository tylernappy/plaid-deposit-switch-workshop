require('dotenv').config();

const express = require('express');
const app = express();

const path = require('path');
const util = require('util');

const PORT = process.env.PORT || 3000;
let DEPOSIT_SWITCH_ID;

const plaid = require('plaid');
const plaidClient = new plaid.Client({
    clientID: process.env.CLIENT_ID,
    secret: process.env.SECRET,
    env: plaid.environments.sandbox,
});

const userData = {
    target_account: {
        account_number: '9900009606',
        routing_number: '011401533',
        account_name: 'Switch to this account!',
        account_subtype: 'checking',
    },
    target_user: {
        given_name: 'Tyler',
        family_name: 'Nappy',
        phone: '14085551234',
        address: {
            street: '1098 Harrison St',
            city: 'San Francisco',
            region: 'CA',
            postal_code: '94107',
            country: 'US'
        },
        email: 'tyler.nappy@example.com',
    },
};

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/create-link-token', async (req, res) => {
    const { target_account: targetAccount, target_user: targetUser } = userData;
    const { deposit_switch_id: depositSwitchId } = await plaidClient.createDepositSwitchAlt(targetAccount, targetUser);

    DEPOSIT_SWITCH_ID = depositSwitchId;

    const { link_token: linkToken } = await plaidClient.createLinkToken({
        user: {
            client_user_id: 'some-cool-user-id',
        },
        client_name: 'App of Tyler',
        products: ['deposit_switch'],
        country_codes: ['US'],
        language: 'en',
        deposit_switch: {
            deposit_switch_id: depositSwitchId,
        },
    });

    res.json({ linkToken });
});

app.get('/get-deposit-switch', async (req, res) => {
    const depositSwitchResponse = await plaidClient.getDepositSwitch(DEPOSIT_SWITCH_ID);
    console.log(util.inspect(depositSwitchResponse, false, null, true));

    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log('listening on port', PORT);
});
