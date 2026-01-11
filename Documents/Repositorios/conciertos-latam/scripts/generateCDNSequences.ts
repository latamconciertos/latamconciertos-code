#!/usr/bin/env tsx

/**
 * CDN Sequence Generator Script
 * 
 * This script generates static JSON files for fan project sequences
 * that can be served from a CDN for optimal performance
 * 
 * Usage:
 *   npm run generate-cdn -- --project=PROJECT_ID
 *   npm run generate-cdn -- --all
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface CDNSongSequence {
    song_id: string;
    song_name: string;
    artist_name: string | null;
    duration_seconds: number;
    mode: 'fixed' | 'strobe';
    sequence: any[];
}

interface CDNProjectSequences {
    project_id: string;
    project_name: string;
    section_id: string;
    section_name: string;
    concert_id: string;
    generated_at: string;
    version: string;
    songs: CDNSongSequence[];
}

async function generateProjectSequences(projectId: string): Promise<CDNProjectSequences[]> {
    console.log(`\n📦 Generating sequences for project: ${projectId}`);

    // 1. Get project details
    const { data: project, error: projectError } = await supabase
        .from('fan_projects')
        .select(`
      id,
      name,
      concert_id,
      concert:concerts (id, title)
    `)
        .eq('id', projectId)
        .single();

    if (projectError) throw projectError;
    if (!project) throw new Error('Project not found');

    console.log(`   Project: ${project.name}`);

    // 2. Get all venue sections
    const { data: sections, error: sectionsError } = await supabase
        .from('venue_sections')
        .select('id, name, code')
        .eq('fan_project_id', projectId)
        .order('display_order');

    if (sectionsError) throw sectionsError;
    if (!sections || sections.length === 0) {
        throw new Error('No venue sections found');
    }

    console.log(`   Sections: ${sections.length}`);

    // 3. Get all songs
    const { data: songs, error: songsError } = await supabase
        .from('fan_project_songs')
        .select('*')
        .eq('fan_project_id', projectId)
        .order('position');

    if (songsError) throw songsError;
    if (!songs || songs.length === 0) {
        throw new Error('No songs found');
    }

    console.log(`   Songs: ${songs.length}`);

    const cdnSequences: CDNProjectSequences[] = [];

    // 4. Generate sequences for each section
    for (const section of sections) {
        const songSequences: CDNSongSequence[] = [];

        for (const song of songs) {
            const { data: colorSeq, error: colorSeqError } = await supabase
                .from('fan_project_color_sequences')
                .select('sequence, mode')
                .eq('fan_project_song_id', song.id)
                .eq('venue_section_id', section.id)
                .single();

            if (colorSeqError) {
                console.warn(`   ⚠️  No sequence for song "${song.song_name}" in section "${section.name}"`);
                continue;
            }

            songSequences.push({
                song_id: song.id,
                song_name: song.song_name,
                artist_name: song.artist_name,
                duration_seconds: song.duration_seconds,
                mode: colorSeq.mode as 'fixed' | 'strobe',
                sequence: colorSeq.sequence as any,
            });
        }

        if (songSequences.length > 0) {
            cdnSequences.push({
                project_id: projectId,
                project_name: project.name,
                section_id: section.id,
                section_name: section.name,
                concert_id: project.concert_id,
                generated_at: new Date().toISOString(),
                version: '1.0.0',
                songs: songSequences,
            });

            console.log(`   ✅ ${section.name}: ${songSequences.length} songs`);
        }
    }

    return cdnSequences;
}

async function saveToFiles(sequences: CDNProjectSequences[], outputDir: string) {
    const projectId = sequences[0]?.project_id;
    if (!projectId) return;

    // Create output directory
    const projectDir = path.join(outputDir, projectId);
    if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
    }

    let totalSize = 0;

    for (const sequence of sequences) {
        const filename = `${sequence.section_id}.json`;
        const filepath = path.join(projectDir, filename);
        const content = JSON.stringify(sequence, null, 2);

        fs.writeFileSync(filepath, content, 'utf-8');

        const sizeKB = (content.length / 1024).toFixed(2);
        totalSize += content.length;

        console.log(`   📄 ${filename} (${sizeKB} KB)`);
    }

    console.log(`\n   💾 Total size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`   📂 Output: ${projectDir}`);
}

async function main() {
    console.log('🚀 CDN Sequence Generator\n');

    const args = process.argv.slice(2);
    const projectArg = args.find(arg => arg.startsWith('--project='));
    const allFlag = args.includes('--all');

    const outputDir = path.join(process.cwd(), 'public', 'cdn', 'sequences');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        if (allFlag) {
            // Generate for all active projects
            const { data: projects, error } = await supabase
                .from('fan_projects')
                .select('id, name')
                .eq('status', 'active');

            if (error) throw error;

            if (!projects || projects.length === 0) {
                console.log('⚠️  No active projects found');
                return;
            }

            console.log(`Found ${projects.length} active project(s)\n`);

            for (const project of projects) {
                const sequences = await generateProjectSequences(project.id);
                await saveToFiles(sequences, outputDir);
            }
        } else if (projectArg) {
            // Generate for specific project
            const projectId = projectArg.split('=')[1];
            const sequences = await generateProjectSequences(projectId);
            await saveToFiles(sequences, outputDir);
        } else {
            console.log('Usage:');
            console.log('  npm run generate-cdn -- --project=PROJECT_ID');
            console.log('  npm run generate-cdn -- --all');
            process.exit(1);
        }

        console.log('\n✅ Generation complete!');
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

main();
