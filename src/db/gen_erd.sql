--=====================================================================
-- MarlinDT Network Intelligence (MNI)
--
-- Corporate Headquarters:
-- Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
-- https://www.merkator.com/
--
-- © 2024-2025 Merkator nv/sa. All rights reserved.
--=====================================================================
COPY (
    SELECT line 
    FROM generate_er_diagram('er-diagram.mermaid')
    ORDER BY line_num
) 
TO 'docs/data-model/er-diagram.mermaid' (header false, quote '', delimiter E'\n');
