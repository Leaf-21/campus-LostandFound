import { toIsoShanghai } from '../../utils/time.js';
import { toUserSummary, type UserSummaryDto } from './user.js';

export interface ApplicationWithRelations {
  id: string;
  postId: string;
  applicationType: string;
  details: string;
  status: string;
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  applicant: { id: string; nickname: string; avatarUrl: string | null };
  post: { title: string };
}

export interface ApplicationDto {
  id: string;
  postId: string;
  postTitle: string;
  applicationType: string;
  details: string;
  status: string;
  applicant: UserSummaryDto;
  reviewNote: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function toApplicationDto(app: ApplicationWithRelations): ApplicationDto {
  return {
    id: app.id,
    postId: app.postId,
    postTitle: app.post.title,
    applicationType: app.applicationType,
    details: app.details,
    status: app.status,
    applicant: toUserSummary(app.applicant),
    reviewNote: app.reviewNote,
    createdAt: toIsoShanghai(app.createdAt),
    updatedAt: toIsoShanghai(app.updatedAt),
  };
}

export const applicationInclude = {
  applicant: { select: { id: true, nickname: true, avatarUrl: true } },
  post: { select: { title: true } },
} as const;
