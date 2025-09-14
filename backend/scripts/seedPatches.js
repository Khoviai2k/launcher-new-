const mongoose = require('mongoose');
const Game = require('../src/models/Game');
const Patch = require('../src/models/Patch');
require('dotenv').config();

// Sample games data
const sampleGames = [
  {
    _id: '730',
    name: 'Counter-Strike: Global Offensive',
    is_free: false,
    requires_vip: true
  },
  {
    _id: '570',
    name: 'Dota 2',
    is_free: true,
    requires_vip: false
  },
  {
    _id: '271590',
    name: 'Grand Theft Auto V',
    is_free: false,
    requires_vip: true
  }
];

// Sample patches data
const samplePatches = [
  // CS:GO patches
  {
    appid: '730',
    author: 'CSGO Modder',
    description: 'Vietnamese Translation Pack for CS:GO',
    size: 2048000, // 2MB
    download_url: 'https://example.com/csgo-vietnamese-pack.zip',
    version: '2.1.0',
    requires_vip: true,
    is_free: false,
    sort_order: 1
  },
  {
    appid: '730',
    author: 'Skin Modder',
    description: 'Custom Weapon Skins Collection',
    size: 5120000, // 5MB
    download_url: 'https://example.com/csgo-skins-collection.zip',
    version: '1.5.2',
    requires_vip: true,
    is_free: false,
    sort_order: 2
  },
  {
    appid: '730',
    author: 'Free Modder',
    description: 'Free Crosshair Pack',
    size: 512000, // 512KB
    download_url: 'https://example.com/csgo-crosshair-pack.zip',
    version: '1.0.0',
    requires_vip: false,
    is_free: true,
    sort_order: 3
  },
  
  // Dota 2 patches
  {
    appid: '570',
    author: 'Dota Translator',
    description: 'Vietnamese Voice Pack for Dota 2',
    size: 10240000, // 10MB
    download_url: 'https://example.com/dota2-vietnamese-voices.zip',
    version: '3.0.1',
    requires_vip: false,
    is_free: true,
    sort_order: 1
  },
  
  // GTA V patches
  {
    appid: '271590',
    author: 'GTA Modder',
    description: 'Realistic Car Physics Mod',
    size: 15360000, // 15MB
    download_url: 'https://example.com/gta5-realistic-physics.zip',
    version: '4.2.0',
    requires_vip: true,
    is_free: false,
    sort_order: 1
  },
  {
    appid: '271590',
    author: 'GTA Free Modder',
    description: 'Free Weather Enhancement Mod',
    size: 8192000, // 8MB
    download_url: 'https://example.com/gta5-weather-mod.zip',
    version: '2.1.0',
    requires_vip: false,
    is_free: true,
    sort_order: 2
  }
];

async function seedGames() {
  console.log('🌱 Seeding games...');
  
  for (const gameData of sampleGames) {
    try {
      const existingGame = await Game.findById(gameData._id);
      if (existingGame) {
        console.log(`   ⚠️  Game ${gameData.name} already exists, skipping...`);
        continue;
      }
      
      const game = new Game(gameData);
      await game.save();
      console.log(`   ✅ Created game: ${gameData.name}`);
    } catch (error) {
      console.error(`   ❌ Error creating game ${gameData.name}:`, error.message);
    }
  }
}

async function seedPatches() {
  console.log('🌱 Seeding patches...');
  
  for (const patchData of samplePatches) {
    try {
      // Check if game exists
      const game = await Game.findById(patchData.appid);
      if (!game) {
        console.log(`   ⚠️  Game ${patchData.appid} not found, skipping patch...`);
        continue;
      }
      
      // Check if patch already exists (by description)
      const existingPatch = await Patch.findOne({
        appid: patchData.appid,
        description: patchData.description
      });
      
      if (existingPatch) {
        console.log(`   ⚠️  Patch "${patchData.description}" already exists, skipping...`);
        continue;
      }
      
      const patch = new Patch(patchData);
      await patch.save();
      console.log(`   ✅ Created patch: ${patchData.description} for ${game.name}`);
    } catch (error) {
      console.error(`   ❌ Error creating patch:`, error.message);
    }
  }
}

async function seedData() {
  try {
    console.log('🚀 Starting patch data seeding...');
    console.log('================================');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tramgame', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Seed games first
    await seedGames();
    
    // Then seed patches
    await seedPatches();
    
    console.log('\n🎉 Seeding completed successfully!');
    console.log('================================');
    
    // Show summary
    const gameCount = await Game.countDocuments();
    const patchCount = await Patch.countDocuments();
    
    console.log(`📊 Summary:`);
    console.log(`   Games: ${gameCount}`);
    console.log(`   Patches: ${patchCount}`);
    
  } catch (error) {
    console.error('💥 Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = {
  seedGames,
  seedPatches,
  seedData
};