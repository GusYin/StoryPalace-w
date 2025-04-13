```bash
📁 storage-bucket/
│
├── 📁 users/
│   └── 📁 {userId}/
│       ├── 📁 voice-samples/
│       │   └── 📁 {voiceName}/
│       │       └── 🗎 {fileName}.mp3  # User voice samples
│       └── 📁 tts/
│           └── ...                    # TTS generated files
│
└── 📁 stories/                         # Story root collection
    │
    ├── 📁 {storyId}/                   # Individual story
    │   ├── 🗎 metadata.json           # StoryMetadata {
    │   │                               #   ✅ title: string
    │   │                               #   ✅ description: string
    │   │                               #   ✅ episodeSeries: string
    │   │                               #   ☑️ language?: "en-US"|"es-ES"...
    │   │                               #   ☑️ recommendedAge?: "3+"|"5-8"...
    │   │                               #   ☑️ categories?: ["fairy-tale",...]
    │   │                               #   ☑️ author?: string
    │   │                               #   ☑️ durationMinutes?: number
    │   │                               # }
    │   │
    │   ├── 🖼 cover.jpg               # Cover image (JPEG <5MB)
    │   │
    │   └── 📁 episodes/               # Episodes collection
    │       │
    │       ├── 📁 {episodeId}/        # Individual episode
    │       │   ├── 🗎 metadata.json  # EpisodeMetadata {
    │       │   │                       #   ✅ title: string
    │       │   │                       #   ☑️ order?: number
    │       │   │                       #   ☑️ durationSeconds?: number
    │       │   │                       #   ☑️ keywords?: string[]
    │       │   │                       # }
    │       │   │
    │       │   ├── 📝 content.txt    # Episode text content
    │       │   │
    │       │   └── 📁 audios/       # Audio variations
    │       │       ├── 🔊 part-1.mp3
    │       │       └── 🔊 part-N.mp3
    │       │
    │       └── ...                   # Additional episodes
    │
    └── ...                           # Additional stories
```

✅ cover.jpg: <5MB JPEG

✅ content.txt: <1MB plain text

✅ \*.mp3: <10MB audio files
