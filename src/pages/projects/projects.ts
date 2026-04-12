export interface Project {
  name: string;
  demoLink: string;
  tags?: string[],
  description?: string;
  postLink?: string;
  demoLinkRel?: string;
  [key: string]: any;
}

export const projects: Project[] = [
  /**
   * 新增项目模板（复制下面对象并取消注释）：
   *
   * 1) 普通项目（纯手动信息）
   * {
   *   name: "项目名称", // 必填
   *   demoLink: "https://example.com", // 项目本身
   *   description: "项目描述", // 可选
   *   tags: ["Tag1", "Tag2"], // 可选
   *   postLink: "https://example.com/post", // 教程
   *   demoLinkRel: "nofollow noopener noreferrer", // 安全性设置
   * },
   *
   * 2) GitHub 仓库项目（需先在文件顶部引入 getRepositoryDetails）
   * {
   *   ...(await getRepositoryDetails("owner/repo")),
   *   name: "项目名称",
   *   demoLink: "https://example.com",
   *   description: "项目描述",
   *   tags: ["Tag1", "Tag2"],
   *   postLink: "https://example.com/post",
   *   demoLinkRel: "nofollow noopener noreferrer",
   * },
   */
]
