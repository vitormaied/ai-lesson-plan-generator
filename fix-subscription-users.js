// Script para corrigir usuários que pagaram mas ainda estão no plano Free
// Execute: node fix-subscription-users.js

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI não encontrada no .env.local');
  process.exit(1);
}

async function fixAffectedUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Conectado ao MongoDB');
    
    const db = client.db();
    const users = db.collection('users');
    
    // Encontrar usuários com subscription.stripeId mas ainda no plano Free
    const affectedUsers = await users.find({
      'subscription.stripeId': { $exists: true, $ne: null },
      'subscription.plan': 'Free'
    }).toArray();
    
    console.log(`Encontrados ${affectedUsers.length} usuários afetados`);
    
    for (const user of affectedUsers) {
      console.log(`\nCorrigindo usuário: ${user.email} (${user.id})`);
      console.log(`  - Stripe ID: ${user.subscription.stripeId}`);
      console.log(`  - Plano atual: ${user.subscription.plan}`);
      console.log(`  - Gerações atuais: ${user.subscription.planGenerations}`);
      
      const result = await users.updateOne(
        { _id: user._id },
        {
          $set: {
            'subscription.plan': 'Personal',
            'subscription.planGenerations': -1, // Unlimited
            'subscription.status': 'active',
            'subscription.isActive': true
          }
        }
      );
      
      if (result.modifiedCount === 1) {
        console.log('  ✅ Usuário corrigido com sucesso!');
      } else {
        console.log('  ❌ Falha ao corrigir usuário');
      }
    }
    
    // Verificar se há usuários corrigidos
    const fixedUsers = await users.find({
      'subscription.stripeId': { $exists: true, $ne: null },
      'subscription.plan': 'Personal'
    }).toArray();
    
    console.log(`\n🎉 Total de usuários com plano Personal: ${fixedUsers.length}`);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.close();
    console.log('\nConexão fechada');
  }
}

// Função para consultar um usuário específico por email
async function checkUserByEmail(email) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const users = db.collection('users');
    
    const user = await users.findOne({ email: email });
    
    if (!user) {
      console.log(`❌ Usuário com email ${email} não encontrado`);
      return;
    }
    
    console.log(`\n📋 Dados do usuário ${email}:`);
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Nome: ${user.name}`);
    console.log(`  - Plano: ${user.subscription.plan}`);
    console.log(`  - Gerações: ${user.subscription.planGenerations}`);
    console.log(`  - Status: ${user.subscription.status || 'N/A'}`);
    console.log(`  - Stripe ID: ${user.subscription.stripeId || 'N/A'}`);
    console.log(`  - Uso atual: ${user.usageCount}`);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.close();
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.length > 0) {
  const command = args[0];
  if (command === '--check' && args[1]) {
    checkUserByEmail(args[1]);
  } else if (command === '--help') {
    console.log(`
Uso:
  node fix-subscription-users.js                    # Corrige todos os usuários afetados
  node fix-subscription-users.js --check EMAIL     # Consulta um usuário específico
  node fix-subscription-users.js --help            # Mostra esta ajuda
    `);
  } else {
    console.log('Argumento inválido. Use --help para ver as opções');
  }
} else {
  fixAffectedUsers();
}