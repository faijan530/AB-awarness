import { prisma } from '../config/database';
import { News, NewsStatus, Prisma } from '@prisma/client';

export class NewsRepository {
  public static async findById(id: string): Promise<News | null> {
    return prisma.news.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        categories: {
          include: { category: true },
        },
        locations: {
          include: { location: true },
        },
        tags: {
          include: { tag: true },
        },
        featuredImage: true,
      },
    });
  }

  public static async findBySlug(slug: string): Promise<News | null> {
    return prisma.news.findFirst({
      where: { slug, deletedAt: null },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        categories: {
          include: { category: true },
        },
        locations: {
          include: { location: true },
        },
        tags: {
          include: { tag: true },
        },
        featuredImage: true,
      },
    });
  }

  public static async findPublished(limit = 20, offset = 0): Promise<News[]> {
    return prisma.news.findMany({
      where: {
        status: NewsStatus.PUBLISHED,
        deletedAt: null,
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        categories: {
          include: { category: true },
        },
        locations: {
          include: { location: true },
        },
      },
    });
  }

  public static async softDelete(id: string): Promise<News> {
    return prisma.news.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
