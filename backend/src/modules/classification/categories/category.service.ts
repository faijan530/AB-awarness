import { NewsStatus } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../middlewares/error.middleware';
import {
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryDTO,
  CategoryTreeNode,
} from './category.types';

export class CategoryService {
  /**
   * Helper: Generate unique slug for category
   */
  public static async generateUniqueSlug(name: string, currentId?: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug || 'category';
    let counter = 1;

    while (true) {
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (!existing || (currentId && existing.id === currentId)) {
        return slug;
      }
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }

  /**
   * Helper: Validate against circular parent hierarchy & max depth of 3
   */
  private static async validateParentHierarchy(categoryId: string | null, parentId: string | null): Promise<void> {
    if (!parentId) return;

    if (categoryId && categoryId === parentId) {
      throw new AppError('A category cannot be its own parent', 400, 'CATEGORY_CIRCULAR_REFERENCE');
    }

    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new AppError('Parent category not found', 404, 'CATEGORY_PARENT_INVALID');
    }

    // Traverse upwards to detect circular loops and depth
    let currentParentId: string | null = parent.parentId;
    let depth = 2; // Parent is depth 1, current new category will be depth 2 or 3

    while (currentParentId) {
      if (categoryId && currentParentId === categoryId) {
        throw new AppError('Circular parent relationship detected', 400, 'CATEGORY_CIRCULAR_REFERENCE');
      }
      depth++;
      if (depth > 3) {
        throw new AppError('Category hierarchy depth cannot exceed 3 levels', 400, 'CATEGORY_MAX_DEPTH_EXCEEDED');
      }

      const ancestor = await prisma.category.findUnique({ where: { id: currentParentId } });
      currentParentId = ancestor?.parentId || null;
    }
  }

  /**
   * List all categories (Optionally only active)
   */
  public static async getCategories(onlyActive = true): Promise<CategoryDTO[]> {
    const categories = await prisma.category.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    return categories;
  }

  /**
   * Build hierarchical category tree (up to 3 levels)
   */
  public static async getCategoryTree(onlyActive = true): Promise<CategoryTreeNode[]> {
    const categories = await prisma.category.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    const categoryMap = new Map<string, CategoryTreeNode>();
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    const tree: CategoryTreeNode[] = [];

    categories.forEach((cat) => {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.children.push(node);
      } else {
        tree.push(node);
      }
    });

    return tree;
  }

  /**
   * Get single category by slug
   */
  public static async getCategoryBySlug(slug: string): Promise<CategoryDTO> {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }
    return category;
  }

  /**
   * Get published news articles for a category
   */
  public static async getNewsByCategorySlug(slug: string, page = 1, limit = 10): Promise<any> {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    const skip = (page - 1) * limit;

    const [newsItems, total] = await Promise.all([
      prisma.newsCategory.findMany({
        where: {
          categoryId: category.id,
          news: { status: NewsStatus.PUBLISHED },
        },
        skip,
        take: limit,
        orderBy: { news: { publishedAt: 'desc' } },
        include: {
          news: {
            include: {
              categories: { include: { category: true } },
              locations: { include: { location: true } },
              author: true,
              featuredImage: true,
            },
          },
        },
      }),
      prisma.newsCategory.count({
        where: {
          categoryId: category.id,
          news: { status: NewsStatus.PUBLISHED },
        },
      }),
    ]);

    const articles = newsItems.map((item) => ({
      id: item.news.id,
      title: item.news.title,
      slug: item.news.slug,
      summary: item.news.shortDescription,
      content: item.news.content,
      coverImageUrl: item.news.featuredImage?.url || null,
      status: item.news.status,
      viewCount: Number(item.news.viewCount),
      isFeatured: item.news.isFeatured,
      isBreaking: item.news.isBreaking,
      publishedAt: item.news.publishedAt,
      createdAt: item.news.createdAt,
      category: item.news.categories.find((c) => c.isPrimary)?.category || item.news.categories[0]?.category || null,
      location: item.news.locations.find((l) => l.isPrimary)?.location || item.news.locations[0]?.location || null,
      author: item.news.author
        ? { id: item.news.author.id, fullName: item.news.author.fullName, avatarUrl: item.news.author.avatarUrl }
        : null,
    }));

    return {
      category,
      articles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Create Category
   */
  public static async createCategory(payload: CreateCategoryPayload): Promise<CategoryDTO> {
    if (!payload.name || !payload.name.trim()) {
      throw new AppError('Category name is required', 400, 'CATEGORY_NAME_REQUIRED');
    }

    await this.validateParentHierarchy(null, payload.parentId || null);

    const slug = await this.generateUniqueSlug(payload.name);

    const category = await prisma.category.create({
      data: {
        name: payload.name.trim(),
        slug,
        description: payload.description ? payload.description.trim() : null,
        parentId: payload.parentId || null,
        displayOrder: payload.displayOrder ?? 0,
        imageUrl: payload.imageUrl || null,
        isActive: payload.isActive ?? true,
      },
    });

    return category;
  }

  /**
   * Admin: Update Category
   */
  public static async updateCategory(id: string, payload: UpdateCategoryPayload): Promise<CategoryDTO> {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    if (payload.parentId !== undefined) {
      await this.validateParentHierarchy(id, payload.parentId);
    }

    let slug = existing.slug;
    if (payload.name && payload.name.trim() !== existing.name) {
      slug = await this.generateUniqueSlug(payload.name, id);
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: payload.name ? payload.name.trim() : undefined,
        slug,
        description: payload.description !== undefined ? (payload.description ? payload.description.trim() : null) : undefined,
        parentId: payload.parentId !== undefined ? payload.parentId : undefined,
        displayOrder: payload.displayOrder !== undefined ? payload.displayOrder : undefined,
        imageUrl: payload.imageUrl !== undefined ? payload.imageUrl : undefined,
        isActive: payload.isActive !== undefined ? payload.isActive : undefined,
      },
    });

    return updated;
  }

  /**
   * Admin: Toggle Active Status
   */
  public static async toggleActive(id: string, isActive: boolean): Promise<CategoryDTO> {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { isActive },
    });

    return updated;
  }

  /**
   * Admin: Delete Category (Deactivates if associated content exists)
   */
  public static async deleteCategory(id: string): Promise<CategoryDTO> {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    const linkedCount = await prisma.newsCategory.count({ where: { categoryId: id } });

    if (linkedCount > 0) {
      // Safely deactivate instead of breaking historical news relationships
      return await prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return await prisma.category.delete({ where: { id } });
  }
}
