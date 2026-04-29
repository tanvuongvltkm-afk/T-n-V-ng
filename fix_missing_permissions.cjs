const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// handleSaveScene
content = content.replace(
  "const handleSaveScene = (epId: number, point: string) => {",
  "const handleSaveScene = (epId: number, point: string) => {\n    if (!canEdit) return;"
);

// handleMentionInput
content = content.replace(
  "const handleMentionInput = (e: React.ChangeEvent<HTMLTextAreaElement>, epId: number, point: string) => {",
  "const handleMentionInput = (e: React.ChangeEvent<HTMLTextAreaElement>, epId: number, point: string) => {\n    if (!canEdit) return;"
);

// handleAICreateEpisode
content = content.replace(
  "const handleAICreateEpisode = async (arcTitle: string) => {",
  "const handleAICreateEpisode = async (arcTitle: string) => {\n    if (!canEdit) return;"
);

// handleSaveNewEpisode
content = content.replace(
  "const handleSaveNewEpisode = async (arcTitle: string) => {",
  "const handleSaveNewEpisode = async (arcTitle: string) => {\n    if (!canEdit) return;"
);

// handleSaveNewArc
content = content.replace(
  "const handleSaveNewArc = async () => {",
  "const handleSaveNewArc = async () => {\n    if (!canEdit) return;"
);

// handleSaveNewSideStory
content = content.replace(
  "const handleSaveNewSideStory = async () => {",
  "const handleSaveNewSideStory = async () => {\n    if (!canEdit) return;"
);

// handleSaveNewMemory
content = content.replace(
  "const handleSaveNewMemory = async () => {",
  "const handleSaveNewMemory = async () => {\n    if (!canEdit) return;"
);

// handleAIGenerateConceptArt
content = content.replace(
  "const handleAIGenerateConceptArt = async () => {",
  "const handleAIGenerateConceptArt = async () => {\n    if (!canEdit) return;"
);

// handleGenerateStoryboardImage
content = content.replace(
  "const handleGenerateStoryboardImage = async (epId: number, point: string, sceneContent: string) => {",
  "const handleGenerateStoryboardImage = async (epId: number, point: string, sceneContent: string) => {\n    if (!canEdit) return;"
);

// handleGenerateFactionDescAI
content = content.replace(
  "const handleGenerateFactionDescAI = async () => {",
  "const handleGenerateFactionDescAI = async () => {\n    if (!canEdit) return;"
);

// handleGenerateFlagAI
content = content.replace(
  "const handleGenerateFlagAI = async () => {",
  "const handleGenerateFlagAI = async () => {\n    if (!canEdit) return;"
);

// handleAddFaction
content = content.replace(
  "const handleAddFaction = async (e: React.FormEvent) => {",
  "const handleAddFaction = async (e: React.FormEvent) => {\n    if (!canEdit) return;"
);

// handleAddArtifact
content = content.replace(
  "const handleAddArtifact = async (e: React.FormEvent) => {",
  "const handleAddArtifact = async (e: React.FormEvent) => {\n    if (!canEdit) return;"
);

// handleGenerateScript
content = content.replace(
  "const handleGenerateScript = async (episode: Episode) => {",
  "const handleGenerateScript = async (episode: Episode) => {\n    if (!canEdit) return;"
);

// handleGenerateVideoPrompt
content = content.replace(
  "const handleGenerateVideoPrompt = async (episode: Episode, content: string) => {",
  "const handleGenerateVideoPrompt = async (episode: Episode, content: string) => {\n    if (!canEdit) return;"
);

// handleGenerateSceneDetail
content = content.replace(
  "const handleGenerateSceneDetail = async (episode: Episode, point: string, pointIdx: number) => {",
  "const handleGenerateSceneDetail = async (episode: Episode, point: string, pointIdx: number) => {\n    if (!canEdit) return;"
);

// handleGenerateVideoPromptForScene
content = content.replace(
  "const handleGenerateVideoPromptForScene = async (episode: Episode, scene: SceneDetail) => {",
  "const handleGenerateVideoPromptForScene = async (episode: Episode, scene: SceneDetail) => {\n    if (!canEdit) return;"
);

// App Logo and other UI settings -> already had check, but let's make sure
content = content.replace(
  "const handleTabIconUpload = (tabId: string, e: React.ChangeEvent<HTMLInputElement>) => {",
  "const handleTabIconUpload = (tabId: string, e: React.ChangeEvent<HTMLInputElement>) => {\n    if (!canEditUI) return;"
);
content = content.replace(
  "const handleStatIconUpload = (statId: string, e: React.ChangeEvent<HTMLInputElement>) => {",
  "const handleStatIconUpload = (statId: string, e: React.ChangeEvent<HTMLInputElement>) => {\n    if (!canEditUI) return;"
);
content = content.replace(
  "const handleAppLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {",
  "const handleAppLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {\n    if (!canEditUI) return;"
);

// AI functions that don't save but are intensive
content = content.replace(
  "const handleAIAnalyzeLogic = async (ep: Episode) => {",
  "const handleAIAnalyzeLogic = async (ep: Episode) => {\n    if (!canEdit) return;"
);

content = content.replace(
  "const handleAIExtractChanges = async (ep: Episode) => {",
  "const handleAIExtractChanges = async (ep: Episode) => {\n    if (!canEdit) return;"
);

fs.writeFileSync('src/App.tsx', content);
