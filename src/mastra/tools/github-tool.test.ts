import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { githubTool } from './github-tool.js';
import { RuntimeContext } from '@mastra/core/runtime-context';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('githubTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GITHUB_TOKEN;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('get_issue action', () => {
    it('should successfully fetch an issue', async () => {
      const mockIssue = {
        id: 123,
        number: 1,
        title: 'Test Issue',
        body: 'This is a test issue',
        state: 'open',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        user: {
          login: 'testuser',
          avatar_url: 'https://avatar.url'
        },
        labels: [{ name: 'bug' }, { name: 'enhancement' }],
        html_url: 'https://github.com/owner/repo/issues/1'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIssue)
      });

      const result = await githubTool.execute({
        context: {
          action: 'get_issue',
          owner: 'testowner',
          repo: 'testrepo',
          issue_number: 1
        },
        runtimeContext: new RuntimeContext()
      });

      expect(result.success).toBe(true);
      expect(result.data.number).toBe(1);
      expect(result.data.title).toBe('Test Issue');
      expect(result.data.labels).toEqual(['bug', 'enhancement']);
      expect(result.message).toBe('Issue retrieved successfully');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/testowner/testrepo/issues/1',
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Mastra-GitHub-Agent'
          }
        }
      );
    });

    it('should include GitHub token in headers when available', async () => {
      process.env.GITHUB_TOKEN = 'test-token';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 123,
          number: 1,
          title: 'Test',
          body: 'Test',
          state: 'open',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          user: { login: 'test', avatar_url: 'url' },
          labels: [],
          html_url: 'url'
        })
      });

      await githubTool.execute({
        context: {
          action: 'get_issue',
          owner: 'testowner',
          repo: 'testrepo',
          issue_number: 1
        },
        runtimeContext: new RuntimeContext()
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/testowner/testrepo/issues/1',
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Mastra-GitHub-Agent',
            Authorization: 'token test-token'
          }
        }
      );
    });

    it('should handle missing issue_number', async () => {
      const result = await githubTool.execute({
        context: {
          action: 'get_issue',
          owner: 'testowner',
          repo: 'testrepo'
        },
        runtimeContext: new RuntimeContext()
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Issue number is required');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await githubTool.execute({
        context: {
          action: 'get_issue',
          owner: 'testowner',
          repo: 'testrepo',
          issue_number: 999
        },
        runtimeContext: new RuntimeContext()
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to fetch issue: 404 Not Found');
    });
  });

  describe('create_issue action', () => {
    it('should successfully create an issue', async () => {
      const mockNewIssue = {
        id: 456,
        number: 2,
        html_url: 'https://github.com/owner/repo/issues/2'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNewIssue)
      });

      const result = await githubTool.execute({
        context: {
          action: 'create_issue',
          owner: 'testowner',
          repo: 'testrepo',
          title: 'New Issue',
          body: 'This is a new issue'
        },
        runtimeContext: new RuntimeContext()
      });

      expect(result.success).toBe(true);
      expect(result.data.issue_number).toBe(2);
      expect(result.data.issue_url).toBe('https://github.com/owner/repo/issues/2');
      expect(result.message).toBe('Issue created successfully');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/testowner/testrepo/issues',
        {
          method: 'POST',
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Mastra-GitHub-Agent',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: 'New Issue',
            body: 'This is a new issue'
          })
        }
      );
    });

    it('should handle missing title or body', async () => {
      const result = await githubTool.execute({
        context: {
          action: 'create_issue',
          owner: 'testowner',
          repo: 'testrepo',
          title: 'Title only'
        },
        runtimeContext: new RuntimeContext()
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Title and body are required');
    });
  });

  describe('get_file_content action', () => {
    it('should successfully fetch file content', async () => {
      const mockFileData = {
        type: 'file',
        content: Buffer.from('# README\n\nThis is a test file.').toString('base64'),
        size: 26,
        sha: 'abc123',
        download_url: 'https://raw.githubusercontent.com/owner/repo/main/README.md'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFileData)
      });

      const result = await githubTool.execute({
        context: {
          action: 'get_file_content',
          owner: 'testowner',
          repo: 'testrepo',
          file_path: 'README.md'
        },
        runtimeContext: new RuntimeContext()
      });

      expect(result.success).toBe(true);
      expect(result.data.content).toBe('# README\n\nThis is a test file.');
      expect(result.data.path).toBe('README.md');
      expect(result.data.size).toBe(26);
      expect(result.data.sha).toBe('abc123');
      expect(result.message).toBe('File content retrieved successfully');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/testowner/testrepo/contents/README.md',
        expect.any(Object)
      );
    });

    it('should handle non-file paths', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ type: 'dir' })
      });

      const result = await githubTool.execute({
        context: {
          action: 'get_file_content',
          owner: 'testowner',
          repo: 'testrepo',
          file_path: 'docs'
        },
        runtimeContext: new RuntimeContext()
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Path does not point to a file');
    });

    it('should handle missing file_path', async () => {
      const result = await githubTool.execute({
        context: {
          action: 'get_file_content',
          owner: 'testowner',
          repo: 'testrepo'
        },
        runtimeContext: new RuntimeContext()
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('File path is required');
    });

    it('should handle file not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await githubTool.execute({
        context: {
          action: 'get_file_content',
          owner: 'testowner',
          repo: 'testrepo',
          file_path: 'nonexistent.md'
        },
        runtimeContext: new RuntimeContext()
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to fetch file: 404 Not Found');
    });
  });

  describe('list_directory_contents action', () => {
    it('should successfully list directory contents', async () => {
      const mockDirData = [
        {
          name: 'README.md',
          path: 'README.md',
          type: 'file',
          size: 1024,
          download_url: 'https://raw.githubusercontent.com/owner/repo/main/README.md'
        },
        {
          name: 'src',
          path: 'src',
          type: 'dir',
          size: 0,
          download_url: null
        },
        {
          name: 'package.json',
          path: 'package.json',
          type: 'file',
          size: 512,
          download_url: 'https://raw.githubusercontent.com/owner/repo/main/package.json'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDirData)
      });

      const result = await githubTool.execute({
        context: {
          action: 'list_directory_contents',
          owner: 'testowner',
          repo: 'testrepo',
          file_path: ''
        },
        runtimeContext: new RuntimeContext()
      });

      expect(result.success).toBe(true);
      expect(result.data.path).toBe('/');
      expect(result.data.contents).toHaveLength(3);
      expect(result.data.contents[0].name).toBe('README.md');
      expect(result.data.contents[0].type).toBe('file');
      expect(result.data.contents[1].name).toBe('src');
      expect(result.data.contents[1].type).toBe('dir');
      expect(result.message).toBe('Directory contents retrieved successfully');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/testowner/testrepo/contents/',
        expect.any(Object)
      );
    });

    it('should list specific subdirectory contents', async () => {
      const mockSubdirData = [
        {
          name: 'index.ts',
          path: 'src/index.ts',
          type: 'file',
          size: 256,
          download_url: 'https://raw.githubusercontent.com/owner/repo/main/src/index.ts'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSubdirData)
      });

      const result = await githubTool.execute({
        context: {
          action: 'list_directory_contents',
          owner: 'testowner',
          repo: 'testrepo',
          file_path: 'src'
        },
        runtimeContext: new RuntimeContext()
      });

      expect(result.success).toBe(true);
      expect(result.data.path).toBe('src');
      expect(result.data.contents).toHaveLength(1);
      expect(result.data.contents[0].name).toBe('index.ts');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/testowner/testrepo/contents/src',
        expect.any(Object)
      );
    });

    it('should handle non-directory paths', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ type: 'file', name: 'README.md' })
      });

      const result = await githubTool.execute({
        context: {
          action: 'list_directory_contents',
          owner: 'testowner',
          repo: 'testrepo',
          file_path: 'README.md'
        },
        runtimeContext: new RuntimeContext()
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Path does not point to a directory');
    });

    it('should handle directory not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await githubTool.execute({
        context: {
          action: 'list_directory_contents',
          owner: 'testowner',
          repo: 'testrepo',
          file_path: 'nonexistent'
        },
        runtimeContext: new RuntimeContext()
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to fetch directory: 404 Not Found');
    });
  });

  describe('validation errors', () => {
    it('should handle invalid action values', async () => {
      const result = await githubTool.execute({
        context: {
          action: 'unknown_action' as any,
          owner: 'testowner',
          repo: 'testrepo'
        },
        runtimeContext: new RuntimeContext()
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Tool validation failed');
      expect(result.message).toContain('Invalid enum value');
    });
  });

  describe('network errors', () => {
    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await githubTool.execute({
        context: {
          action: 'get_issue',
          owner: 'testowner',
          repo: 'testrepo',
          issue_number: 1
        },
        runtimeContext: new RuntimeContext()
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('GitHub API error: Network error');
    });
  });
});