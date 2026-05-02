from pathlib import Path


def _parse_frontmatter(text: str) -> dict:
    lines = text.splitlines()
    if not lines or lines[0].strip() != '---':
        return {}

    end_index = None
    for index in range(1, len(lines)):
        if lines[index].strip() == '---':
            end_index = index
            break
    if end_index is None:
        return {}

    data = {}
    index = 1
    while index < end_index:
        line = lines[index]
        if ':' not in line:
            index += 1
            continue

        key, raw_value = line.split(':', 1)
        key = key.strip()
        value = raw_value.lstrip()

        if value in {'|', '>'}:
            collected = []
            index += 1
            while index < end_index:
                next_line = lines[index]
                if next_line.startswith('  ') or not next_line.strip():
                    collected.append(next_line[2:] if next_line.startswith('  ') else '')
                    index += 1
                    continue
                break
            data[key] = '\n'.join(part.rstrip() for part in collected).strip()
            continue

        data[key] = value.strip().strip('"').strip("'")
        index += 1

    return data


def parse_skill_metadata(skill_file: Path) -> dict:
    text = skill_file.read_text(encoding='utf-8', errors='ignore')
    frontmatter = _parse_frontmatter(text)
    title = skill_file.parent.name
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith('# '):
            title = stripped[2:].strip()
            break

    return {
        'name': skill_file.parent.name,
        'title': title,
        'description': frontmatter.get('description', '').replace('\n', ' ').strip(),
        'path': str(skill_file),
    }
