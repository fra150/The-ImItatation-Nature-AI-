// src/models/refreshToken.js
//
// Sessioni di refresh REVOCABILI. Il token di accesso (JWT) resta stateless
// e a vita breve (vedi authController) — la vera "logout con revoca" avviene
// qui: revocare la riga impedisce di ottenere nuovi access token, anche se il
// JWT corrente non è ancora scaduto (finestra breve e accettata, standard per
// questo pattern). Si salva l'HASH del token, mai il valore in chiaro — stesso
// principio delle password: un leak del DB non espone token utilizzabili.
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class RefreshToken extends Model {}

RefreshToken.init(
  {
    tokenHash: {
      type: DataTypes.STRING(64), // sha256 hex = 64 caratteri
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
  },
);

module.exports = RefreshToken;
