const {Client: PostgresClient} = require('pg');

const sqlConnection = new PostgresClient({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

sqlConnection.connect()
    .then(_ => console.log('connecté'))
    .catch(_ => console.log('Unable to connect to the database.'));

async function GetUserLevel(guildId, memberId) {
    const query = `SELECT GetUserLevel(${guildId}, ${memberId})`;
    const result = await sqlConnection.query(query);

    return result.rows[0].getuserlevel;
}

async function UpdateMemberXp(guildId, memberId) {
    const query = `CALL UpdateMemberXp(${guildId}, ${memberId})`;
    await sqlConnection.query(query);
}

async function GetServerLogChannel(guildId) {
    const query = `SELECT GetServerLogChannel(${guildId})`;
    const result = await sqlConnection.query(query);

    return result.rows[0].getserverlogchannel;
}

async function RegisterUser(guildId, memberId) {
    const query = `CALL RegisterUser(${guildId}, ${memberId})`;
    await sqlConnection.query(query);
}

module.exports = {
    sqlConnection: sqlConnection,
    GetUserLevel: GetUserLevel,
    UpdateMemberXp: UpdateMemberXp,
    GetServerLogChannel: GetServerLogChannel,
    RegisterUser: RegisterUser
};