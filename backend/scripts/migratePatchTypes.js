const mongoose = require('mongoose');
const Patch = require('../src/models/Patch');
require('dotenv').config();

/**
 * Migration script để chuyển đổi từ requires_vip/is_free sang patch_type
 * Chạy script này một lần để cập nhật dữ liệu hiện có
 */

async function migratePatchTypes() {
  try {
    console.log('🔄 Starting patch type migration...');
    console.log('=====================================');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tramgame', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Tìm tất cả patches hiện có
    const patches = await Patch.find({});
    console.log(`📊 Found ${patches.length} patches to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const patch of patches) {
      try {
        // Kiểm tra xem đã có patch_type chưa
        if (patch.patch_type) {
          console.log(`   ⚠️  Patch ${patch._id} already has patch_type: ${patch.patch_type}, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Migration logic
        let newPatchType = 'premium'; // default
        
        // Nếu có is_free = true hoặc requires_vip = false, set thành 'free'
        if (patch.is_free === true || patch.requires_vip === false) {
          newPatchType = 'free';
        }
        
        // Cập nhật patch
        patch.patch_type = newPatchType;
        
        // Xóa các field cũ (optional - để backward compatibility)
        // patch.is_free = undefined;
        // patch.requires_vip = undefined;
        
        await patch.save();
        
        console.log(`   ✅ Migrated patch ${patch._id}: ${patch.description} -> ${newPatchType}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error migrating patch ${patch._id}:`, error.message);
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('========================');
    console.log(`📊 Summary:`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${patches.length}`);
    
    // Hiển thị thống kê sau migration
    const freePatches = await Patch.countDocuments({ patch_type: 'free' });
    const premiumPatches = await Patch.countDocuments({ patch_type: 'premium' });
    
    console.log('\n📈 Current patch distribution:');
    console.log(`   Free patches: ${freePatches}`);
    console.log(`   Premium patches: ${premiumPatches}`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Chạy migration nếu file được execute trực tiếp
if (require.main === module) {
  migratePatchTypes();
}

module.exports = {
  migratePatchTypes
};