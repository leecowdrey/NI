--=====================================================================
-- Network Insight (NI)
--
-- Corporate Headquarters:
-- Cowdrey Consulting · United Kingdom · T:+447442104556 
-- https://www.cowdrey.net/
--
-- © 2026 Cowdrey Consulting. All rights reserved.
--=====================================================================
COPY (
    SELECT line 
    FROM generate_er_diagram('er-diagram.mermaid')
    ORDER BY line_num
) 
TO 'docs/data-model/er-diagram.mermaid' (header false, quote '', delimiter E'\n');
