/**
@license
SPDX-License-Identifier: Apache-2.0
*/

export interface SceneDetail {
  point: string;
  content: string; // Hành động và đối thoại chi tiết (Phân Cảnh)
  videoPrompt?: string; // Prompt video 15s (Seedance 2.0)
  storyboardImage?: string; // Hình ảnh storyboard
}

export interface Episode {
  id: number;
  title: string;
  arc: string; // Tên của "Tập" (xưa là Phần/Hồi)
  summary: string[]; // Danh sách các "Phân đoạn" (Video Prompt 15s)
  status: 'draft' | 'detailed' | 'final';
  scenes?: SceneDetail[];
  isProduced?: boolean;
  logicWarnings?: string;
  characterName?: string; // Tên nhân vật liên quan (cho Ký Ức)
}

export interface StoryArc {
  id: string;
  title: string;
  episodes: number[]; // Danh sách ID các "Cảnh" (xưa là Tập)
  keyPoints?: string[]; // Mấu chốt của Tập này
  coverImage?: string;
  order?: number;
}

export interface Character {
  id?: string;
  name: string;
  role: string;
  description: string;
  faction: 'Chính phái' | 'Tà phái' | 'Trung lập' | 'NPC';
  past?: string;       // Quá khứ
  weapon?: string;     // Tên vũ khí
  weaponOrigin?: string; // Nguồn gốc vũ khí
  weaponAvatar?: string; // Ảnh vũ khí
  fullBodyImage?: string; // Ảnh toàn thân
  abbreviation?: string; // Tên viết tắt (VD: TV)
  personality?: string; // Tính cách
  attire?: string;      // Trang phục/Y phục
  relationships?: string; // Mối quan hệ
  martialArtsBeginner?: string;
  martialArtsIntermediate?: string;
  martialArtsAdvanced?: string;
  martialArtsSpecial?: string; // Cơ duyên
  avatar?: string;      // Base64 avatar image
  status?: 'appeared' | 'upcoming'; // Trạng thái xuất hiện
  stateTimeline?: { episodeId: number, detail: string }[]; // Dòng thời gian biến cố
  order?: number;
}

export interface FactionMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  x: number; // Tọa độ x cho sơ đồ (0-100)
  y: number; // Tọa độ y cho sơ đồ (0-100)
  parentId?: string;
  row?: number; // Hàng ngang (1-8)
}

export interface Faction {
  id?: string;
  name: string;
  description: string;
  flagAvatar?: string;
  alignment?: 'Chính phái' | 'Tà phái' | 'Trung lập';
  leader?: string;
  abbreviation?: string;
  members?: FactionMember[];
  order?: number;
}

export interface Artifact {
  id: string;
  name: string;
  origin: string;
  effect: string;
  avatar: string; // Base64 image
  abbreviation?: string;
}

export interface Weapon {
  id: string;
  name: string;
  origin: string;
  effect: string;
  avatar: string;
  owner?: string;
  abbreviation?: string;
}

export interface WorldLocation {
  name: string;
  description: string;
  avatar?: string;
  type: 'city' | 'village';
}
