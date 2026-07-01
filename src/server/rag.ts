import { GoogleGenAI } from "@google/genai";

export interface RagDocumentChunk {
    id: string;
    text: string;
    embedding: number[];
}

export interface RagIndex {
    chunks: RagDocumentChunk[];
}

// In-memory store: courseId -> RagIndex
const vectorStore: Record<string, RagIndex> = {};

// Helper: Cosine similarity
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Chunking function
export function chunkText(text: string, maxChunkSize = 1000, overlap = 200): string[] {
    const chunks: string[] = [];
    let startIndex = 0;
    while (startIndex < text.length) {
        let endIndex = startIndex + maxChunkSize;
        if (endIndex < text.length) {
            // Try to find a sentence boundary
            const lastPeriod = text.lastIndexOf('.', endIndex);
            if (lastPeriod > startIndex + maxChunkSize / 2) {
                endIndex = lastPeriod + 1;
            }
        }
        chunks.push(text.slice(startIndex, endIndex).trim());
        startIndex = endIndex - overlap;
        
        // Prevent infinite loop if something goes wrong with indices
        if (overlap >= maxChunkSize) break;
    }
    return chunks;
}

// Ingest text
export async function ingestDocument(aiInstance: GoogleGenAI, courseId: string, text: string) {
    const chunks = chunkText(text);
    const embeddedChunks: RagDocumentChunk[] = [];
    
    // We process chunks sequentially to respect API rate limits
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk) continue;
        try {
             const response = await aiInstance.models.embedContent({
                 model: 'text-embedding-004',
                 contents: chunk
             });
             if (response.embeddings && response.embeddings[0]?.values) {
                 embeddedChunks.push({
                     id: `${courseId}-chunk-${i}`,
                     text: chunk,
                     embedding: response.embeddings[0].values
                 });
             }
        } catch (e) {
             console.error(`Error embedding chunk ${i}:`, e);
        }
    }
    
    // Store or append in memory
    if (!vectorStore[courseId]) {
        vectorStore[courseId] = { chunks: [] };
    }
    vectorStore[courseId].chunks.push(...embeddedChunks);
    
    return { success: true, ingestedChunks: embeddedChunks.length, totalChunks: vectorStore[courseId].chunks.length };
}

// Clear index for a specific course
export function clearCourseIndex(courseId: string) {
    if (vectorStore[courseId]) {
        delete vectorStore[courseId];
    }
}

// Retrieve relevant chunks
export async function retrieveChunks(aiInstance: GoogleGenAI, courseId: string, query: string, topK: number = 3): Promise<RagDocumentChunk[]> {
    const index = vectorStore[courseId];
    if (!index || index.chunks.length === 0) {
        return [];
    }
    
    const response = await aiInstance.models.embedContent({
        model: 'text-embedding-004',
        contents: query
    });
    
    const queryEmbedding = response.embeddings?.[0]?.values;
    if (!queryEmbedding) return [];
    
    const scoredChunks = index.chunks.map(chunk => ({
        chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));
    
    scoredChunks.sort((a, b) => b.score - a.score);
    
    return scoredChunks.slice(0, topK).map(sc => sc.chunk);
}
