import { Request, Response } from 'express';
import { AgentVersionService } from '../services/agent-version.service';

export class AgentVersionController {
  static async list(req: Request, res: Response) {
    try {
      const versions = await AgentVersionService.listVersions();
      return res.status(200).json({ success: true, data: versions });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to list agent versions' });
    }
  }

  static async getActive(req: Request, res: Response) {
    try {
      const version = await AgentVersionService.getActiveVersion();
      return res.status(200).json({ success: true, data: version });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch active version' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const version = await AgentVersionService.getVersionById(req.params.id);
      return res.status(200).json({ success: true, data: version });
    } catch (error: any) {
      return res.status(404).json({ success: false, error: error.message || 'Agent version not found' });
    }
  }

  static async createDraft(req: Request, res: Response) {
    try {
      const { versionTag, label, description, systemInstructions, skillsDefinition, rubricSnapshot, evaluationPatterns, modelConfig } = req.body;
      if (!versionTag || !label || !description || !systemInstructions) {
        return res.status(400).json({
          success: false,
          error: 'Version tag, label, description, and system instructions are required',
        });
      }

      const created = await AgentVersionService.createDraftVersion(
        {
          versionTag,
          label,
          description,
          systemInstructions,
          skillsDefinition,
          rubricSnapshot,
          evaluationPatterns,
          modelConfig,
        },
        req.user
      );

      return res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to create agent version draft' });
    }
  }

  static async updateDraft(req: Request, res: Response) {
    try {
      const updated = await AgentVersionService.updateDraftVersion(req.params.id, req.body, req.user);
      return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to update agent version draft' });
    }
  }

  static async lockVersion(req: Request, res: Response) {
    try {
      const locked = await AgentVersionService.lockVersion(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        message: `Version ${locked.versionTag} successfully locked as an immutable research snapshot.`,
        data: locked,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to lock agent version' });
    }
  }

  static async activateVersion(req: Request, res: Response) {
    try {
      const active = await AgentVersionService.activateVersion(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        message: `Version ${active.versionTag} is now the active evaluation agent.`,
        data: active,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to activate agent version' });
    }
  }

  static async compare(req: Request, res: Response) {
    try {
      const { vA, vB } = req.query;
      if (!vA || !vB) {
        return res.status(400).json({ success: false, error: 'Query parameters vA and vB are required' });
      }
      const comparison = await AgentVersionService.compareVersions(String(vA), String(vB));
      return res.status(200).json({ success: true, data: comparison });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to compare versions' });
    }
  }

  static async branchVersion(req: Request, res: Response) {
    try {
      const { parentVersionTag, newVersionTag, label, description, systemInstructions, skillsDefinition, rubricSnapshot, evaluationPatterns, modelConfig, changelogEntry } = req.body;

      if (!parentVersionTag || !newVersionTag || !label || !description || !changelogEntry) {
        return res.status(400).json({
          success: false,
          error: 'parentVersionTag, newVersionTag, label, description, and changelogEntry are required',
        });
      }

      const branched = await AgentVersionService.branchNextVersion(
        {
          parentVersionTag,
          newVersionTag,
          label,
          description,
          systemInstructions,
          skillsDefinition,
          rubricSnapshot,
          evaluationPatterns,
          modelConfig,
          changelogEntry,
        },
        req.user
      );

      return res.status(201).json({
        success: true,
        message: `Version ${branched.versionTag} branched successfully from ${parentVersionTag}.`,
        data: branched,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to branch agent version' });
    }
  }
}
