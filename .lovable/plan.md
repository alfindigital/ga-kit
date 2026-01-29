

# Negative Keyword Manager

## Deskripsi
Tool untuk mengelola negative keywords Google Ads dengan fitur deduplikasi, konversi match types, dan **deteksi konflik** terhadap positive keywords.

---

## Fitur Utama

### 1. Input Areas
- **Negative Keywords Input**: Textarea untuk paste/input negative keywords (satu per baris)
- **Positive Keywords Input** (opsional): Textarea untuk paste positive keywords yang akan dibandingkan
- Support input dalam berbagai format: `keyword`, `"keyword"`, `[keyword]`

### 2. Processing Options

#### Match Type Conversion
- **Strip All**: Hapus semua formatting `"` dan `[]` → output sebagai plain text
- **Convert to Broad**: Semua keyword tanpa wrapper
- **Convert to Phrase**: Semua keyword dalam `"quotes"`
- **Convert to Exact**: Semua keyword dalam `[brackets]`
- **Keep Original**: Pertahankan format input

#### Deduplicate Options
- **Case Insensitive**: `Shoes` = `shoes` = `SHOES`
- **Ignore Match Type**: `shoes` = `"shoes"` = `[shoes]` (dianggap sama)
- **Trim Whitespace**: Hapus spasi di awal/akhir

### 3. Conflict Detection
Deteksi konflik antara negative dan positive keywords:

| Conflict Type | Contoh | Severity |
|--------------|--------|----------|
| **Exact Match** | Negative: `shoes` vs Positive: `shoes` | 🔴 Critical |
| **Phrase Contained** | Negative: `"running shoes"` blocks Positive: `buy running shoes online` | 🟡 Warning |
| **Broad Block** | Negative: `shoes` blocks semua positive dengan "shoes" | 🟠 Caution |

### 4. Output & Actions
- **Clean Keywords List**: Hasil setelah proses
- **Conflicts Report**: Daftar konflik yang ditemukan
- **Statistics**: Total input, unique, duplicates removed, conflicts found
- **Export Options**: TXT, CSV (dengan atau tanpa conflicts)

---

## Struktur UI

```
┌─────────────────────────────────────────────────────────┐
│  Negative Keyword Manager                    [Sample] [Reset] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ Processing Options ─────────────────────────────┐  │
│  │ Output Format: ○ Broad  ○ Phrase  ○ Exact  ○ Keep │  │
│  │ ☑ Case insensitive  ☑ Ignore match type          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────┬─────────────────────────────────┐ │
│  │ Negative KWs    │ Positive KWs (optional)         │ │
│  │ ┌─────────────┐ │ ┌─────────────────────────────┐ │ │
│  │ │ running     │ │ │ buy running shoes          │ │ │
│  │ │ "free"      │ │ │ best sneakers online       │ │ │
│  │ │ [cheap]     │ │ │ cheap running gear         │ │ │
│  │ └─────────────┘ │ └─────────────────────────────┘ │ │
│  │   📊 3 keywords │   📊 3 keywords                 │ │
│  └─────────────────┴─────────────────────────────────┘ │
│                                                         │
│  ┌─ Results ────────────────────────────────────────┐  │
│  │                                      [Copy] [Export]│ │
│  │  Clean Keywords (2 unique)                        │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ running                                     │  │  │
│  │  │ free                                        │  │  │
│  │  │ cheap                                       │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │                                                   │  │
│  │  ⚠️ Conflicts Detected (2)                       │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ 🔴 "running" conflicts with "buy running..."│  │  │
│  │  │ 🟠 "cheap" may block "cheap running gear"  │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Langkah Implementasi

### 1. Buat File Baru `src/pages/NegativeKeywords.tsx`

**State Management:**
```typescript
// Input states
const [negativeInput, setNegativeInput] = useState('');
const [positiveInput, setPositiveInput] = useState('');

// Options
const [outputFormat, setOutputFormat] = useState<'broad'|'phrase'|'exact'|'keep'>('broad');
const [caseInsensitive, setCaseInsensitive] = useState(true);
const [ignoreMatchType, setIgnoreMatchType] = useState(true);

// Results computed
const processedKeywords = useMemo(() => {...}, [negativeInput, options]);
const conflicts = useMemo(() => {...}, [negativeInput, positiveInput]);
```

**Core Functions:**
- `parseKeyword(input: string)`: Extract keyword dan match type
- `normalizeKeyword(kw: string, options)`: Normalize untuk perbandingan
- `formatKeyword(kw: string, format)`: Apply output format
- `detectConflicts(negatives, positives)`: Cari konflik
- `removeDuplicates(keywords, options)`: Deduplikasi

### 2. Skeleton Component
Buat `src/components/skeletons/NegativeKeywordsSkeleton.tsx` mengikuti pola yang ada.

### 3. Update Routing (`src/App.tsx`)
```typescript
import NegativeKeywords from "./pages/NegativeKeywords";
// ...
<Route path="/negative-keywords" element={<NegativeKeywords />} />
```

### 4. Update Navigation
- `src/components/layout/Header.tsx`: Tambah ke `navItems`
- `src/pages/Dashboard.tsx`: Tambah ke array `tools`

### 5. Conflict Detection Algorithm

```typescript
interface Conflict {
  negativeKeyword: string;
  positiveKeyword: string;
  type: 'exact' | 'phrase' | 'broad';
  severity: 'critical' | 'warning' | 'caution';
  message: string;
}

function detectConflicts(negatives: ParsedKW[], positives: ParsedKW[]): Conflict[] {
  const conflicts: Conflict[] = [];
  
  for (const neg of negatives) {
    for (const pos of positives) {
      // Exact match check
      if (neg.normalized === pos.normalized) {
        conflicts.push({...});
      }
      // Phrase contained check
      else if (neg.matchType === 'phrase' && pos.normalized.includes(neg.normalized)) {
        conflicts.push({...});
      }
      // Broad match check (any word match)
      else if (neg.matchType === 'broad') {
        const negWords = neg.normalized.split(' ');
        if (negWords.some(w => pos.normalized.includes(w))) {
          conflicts.push({...});
        }
      }
    }
  }
  return conflicts;
}
```

---

## File yang Akan Dibuat/Dimodifikasi

| File | Action |
|------|--------|
| `src/pages/NegativeKeywords.tsx` | **CREATE** - Halaman utama tool |
| `src/components/skeletons/NegativeKeywordsSkeleton.tsx` | **CREATE** - Loading skeleton |
| `src/components/skeletons/index.ts` | **MODIFY** - Export skeleton baru |
| `src/App.tsx` | **MODIFY** - Tambah route |
| `src/components/layout/Header.tsx` | **MODIFY** - Tambah nav item |
| `src/pages/Dashboard.tsx` | **MODIFY** - Tambah ke tools grid |

---

## Dependencies
Tidak memerlukan package baru - menggunakan komponen UI yang sudah ada:
- `Card`, `Textarea`, `Button`, `Checkbox`
- `RadioGroup` untuk output format
- `Badge` untuk conflict severity
- `Alert` untuk conflict warnings
- Hooks: `useClipboard`, `useExport`, `useToast`, `usePageLoading`

