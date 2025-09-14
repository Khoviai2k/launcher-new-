const Patch = require('../models/Patch');
const Game = require('../models/Game');
const AuditLog = require('../models/AuditLog');

class PatchController {
  /**
   * Lấy danh sách patches cho một game cụ thể
   * GET /api/patches/:appid
   */
  async getPatchesByGame(req, res) {
    try {
      const { appid } = req.params;
      const user = req.user; // Từ auth middleware

      // Kiểm tra game có tồn tại không
      const game = await Game.findById(appid);
      if (!game) {
        return res.status(404).json({
          success: false,
          message: 'Game not found'
        });
      }

      // Lấy patches mà user có thể truy cập
      const patches = await Patch.findAccessibleByGameId(appid, user);

      // Format response
      const formattedPatches = patches.map(patch => ({
        id: patch._id,
        appid: patch.appid,
        author: patch.author,
        description: patch.description,
        size: patch.size,
        version: patch.version,
        patch_type: patch.patch_type,
        free_until: patch.free_until,
        stats: {
          downloads: patch.stats.downloads
        },
        created_at: patch.created_at,
        updated_at: patch.updated_at
      }));

      res.json({
        success: true,
        data: {
          game: {
            id: game._id,
            name: game.name
          },
          patches: formattedPatches
        }
      });

    } catch (error) {
      console.error('Error getting patches by game:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Lấy thông tin chi tiết một patch
   * GET /api/patches/:appid/:patchId
   */
  async getPatchDetail(req, res) {
    try {
      const { appid, patchId } = req.params;
      const user = req.user;

      const patch = await Patch.findOne({
        _id: patchId,
        appid: appid,
        active: true
      });

      if (!patch) {
        return res.status(404).json({
          success: false,
          message: 'Patch not found'
        });
      }

      // Kiểm tra quyền truy cập
      if (!patch.isAccessible(user)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this patch'
        });
      }

      res.json({
        success: true,
        data: {
          id: patch._id,
          appid: patch.appid,
          author: patch.author,
          description: patch.description,
          size: patch.size,
          version: patch.version,
          patch_type: patch.patch_type,
          free_until: patch.free_until,
          stats: {
            downloads: patch.stats.downloads
          },
          created_at: patch.created_at,
          updated_at: patch.updated_at
        }
      });

    } catch (error) {
      console.error('Error getting patch detail:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Download patch - trả về download URL
   * GET /api/patches/:appid/:patchId/download
   */
  async downloadPatch(req, res) {
    try {
      const { appid, patchId } = req.params;
      const user = req.user;

      const patch = await Patch.findOne({
        _id: patchId,
        appid: appid,
        active: true
      });

      if (!patch) {
        return res.status(404).json({
          success: false,
          message: 'Patch not found'
        });
      }

      // Kiểm tra quyền truy cập
      if (!patch.isAccessible(user)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to download this patch'
        });
      }

      // Tăng download count
      await patch.incrementDownloadCount();

      // Log download action
      await AuditLog.logUserAction(
        user._id,
        'PATCH_DOWNLOAD',
        'Patch',
        patch._id.toString(),
        {
          appid: patch.appid,
          patch_author: patch.author,
          patch_version: patch.version,
          patch_type: patch.patch_type,
          file_size: patch.size
        }
      );

      res.json({
        success: true,
        data: {
          download_url: patch.download_url,
          patch_info: {
            id: patch._id,
            author: patch.author,
            description: patch.description,
            size: patch.size,
            version: patch.version,
            patch_type: patch.patch_type
          }
        }
      });

    } catch (error) {
      console.error('Error downloading patch:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Tìm kiếm patches (admin only)
   * GET /api/patches/search
   */
  async searchPatches(req, res) {
    try {
      const { q, appid, author, patch_type, page = 1, limit = 10 } = req.query;
      const user = req.user;

      // Chỉ admin mới được search toàn bộ patches
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const query = { active: true };

      // Text search
      if (q) {
        query.$text = { $search: q };
      }

      // Filter by game
      if (appid) {
        query.appid = appid;
      }

      // Filter by author
      if (author) {
        query.author = new RegExp(author, 'i');
      }

      // Filter by patch type
      if (patch_type && ['free', 'premium'].includes(patch_type)) {
        query.patch_type = patch_type;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [patches, total] = await Promise.all([
        Patch.find(query)
          .sort(q ? { score: { $meta: 'textScore' } } : { created_at: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Patch.countDocuments(query)
      ]);

      const formattedPatches = patches.map(patch => ({
        id: patch._id,
        appid: patch.appid,
        author: patch.author,
        description: patch.description,
        size: patch.size,
        version: patch.version,
        patch_type: patch.patch_type,
        free_until: patch.free_until,
        stats: {
          downloads: patch.stats.downloads
        },
        created_at: patch.created_at,
        updated_at: patch.updated_at
      }));

      res.json({
        success: true,
        data: {
          patches: formattedPatches,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Error searching patches:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Tạo patch mới (admin only)
   * POST /api/patches
   */
  async createPatch(req, res) {
    try {
      const user = req.user;

      // Chỉ admin mới được tạo patch
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const {
        appid,
        author,
        description,
        size,
        download_url,
        version = '',
        patch_type = 'premium',
        free_until = null,
        sort_order = 0
      } = req.body;

      // Validate required fields
      if (!appid || !author || !description || !size || !download_url) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: appid, author, description, size, download_url'
        });
      }

      // Validate patch_type
      if (!['free', 'premium'].includes(patch_type)) {
        return res.status(400).json({
          success: false,
          message: 'patch_type must be either "free" or "premium"'
        });
      }

      // Kiểm tra game có tồn tại không
      const game = await Game.findById(appid);
      if (!game) {
        return res.status(404).json({
          success: false,
          message: 'Game not found'
        });
      }

      // Tạo patch mới
      const patch = new Patch({
        appid,
        author,
        description,
        size: parseInt(size),
        download_url,
        version,
        patch_type,
        free_until: free_until ? new Date(free_until) : null,
        sort_order: parseInt(sort_order)
      });

      await patch.save();

      // Log action
      await AuditLog.logUserAction(
        user._id,
        'PATCH_CREATE',
        'Patch',
        patch._id.toString(),
        {
          appid: patch.appid,
          author: patch.author,
          version: patch.version,
          patch_type: patch.patch_type
        }
      );

      res.status(201).json({
        success: true,
        data: {
          id: patch._id,
          appid: patch.appid,
          author: patch.author,
          description: patch.description,
          size: patch.size,
          version: patch.version,
          patch_type: patch.patch_type,
          free_until: patch.free_until,
          sort_order: patch.sort_order,
          created_at: patch.created_at
        }
      });

    } catch (error) {
      console.error('Error creating patch:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Cập nhật patch (admin only)
   * PUT /api/patches/:patchId
   */
  async updatePatch(req, res) {
    try {
      const { patchId } = req.params;
      const user = req.user;

      // Chỉ admin mới được cập nhật patch
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const patch = await Patch.findById(patchId);
      if (!patch) {
        return res.status(404).json({
          success: false,
          message: 'Patch not found'
        });
      }

      const {
        author,
        description,
        size,
        download_url,
        version,
        patch_type,
        free_until,
        sort_order,
        active
      } = req.body;

      // Update fields
      if (author !== undefined) patch.author = author;
      if (description !== undefined) patch.description = description;
      if (size !== undefined) patch.size = parseInt(size);
      if (download_url !== undefined) patch.download_url = download_url;
      if (version !== undefined) patch.version = version;
      if (patch_type !== undefined) {
        if (!['free', 'premium'].includes(patch_type)) {
          return res.status(400).json({
            success: false,
            message: 'patch_type must be either "free" or "premium"'
          });
        }
        patch.patch_type = patch_type;
      }
      if (free_until !== undefined) patch.free_until = free_until ? new Date(free_until) : null;
      if (sort_order !== undefined) patch.sort_order = parseInt(sort_order);
      if (active !== undefined) patch.active = active;

      await patch.save();

      // Log action
      await AuditLog.logUserAction(
        user._id,
        'PATCH_UPDATE',
        'Patch',
        patch._id.toString(),
        {
          appid: patch.appid,
          author: patch.author,
          version: patch.version,
          patch_type: patch.patch_type
        }
      );

      res.json({
        success: true,
        data: {
          id: patch._id,
          appid: patch.appid,
          author: patch.author,
          description: patch.description,
          size: patch.size,
          version: patch.version,
          patch_type: patch.patch_type,
          free_until: patch.free_until,
          sort_order: patch.sort_order,
          active: patch.active,
          updated_at: patch.updated_at
        }
      });

    } catch (error) {
      console.error('Error updating patch:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Xóa patch (admin only)
   * DELETE /api/patches/:patchId
   */
  async deletePatch(req, res) {
    try {
      const { patchId } = req.params;
      const user = req.user;

      // Chỉ admin mới được xóa patch
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const patch = await Patch.findById(patchId);
      if (!patch) {
        return res.status(404).json({
          success: false,
          message: 'Patch not found'
        });
      }

      // Soft delete - chỉ set active = false
      patch.active = false;
      await patch.save();

      // Log action
      await AuditLog.logUserAction(
        user._id,
        'PATCH_DELETE',
        'Patch',
        patch._id.toString(),
        {
          appid: patch.appid,
          author: patch.author,
          version: patch.version,
          patch_type: patch.patch_type
        }
      );

      res.json({
        success: true,
        message: 'Patch deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting patch:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new PatchController();