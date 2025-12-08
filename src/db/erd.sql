--=====================================================================
-- Network Insight (NI)
--
-- Corporate Headquarters:
-- Cowdrey Consulting · United Kingdom · T:+447442104556 
-- https://www.cowdrey.net/
--
-- © 2026 Cowdrey Consulting. All rights reserved.
--=====================================================================
CREATE OR REPLACE MACRO generate_er_diagram(output_path, table_pattern :='%', rel_style:='}o--o{') AS TABLE 
WITH hlp AS (
    SELECT 
        referenced_table,
        c.table_name,
        trim(string_agg(d.comment, ' ')) AS comment,
        list_reduce(referenced_column_names, (x,y) -> concat(x, ',', y)) AS columns,
        list_reduce(constraint_column_names, (x,y) -> concat(x, ',', y)) AS fk_columns
    FROM duckdb_constraints() c
    JOIN duckdb_columns d 
        ON d.table_name = c.table_name 
        AND list_contains(c.constraint_column_names, d.column_name)
    WHERE constraint_type = 'FOREIGN KEY'
        AND c.table_name LIKE table_pattern
    GROUP BY ALL
)
SELECT 
    output_path AS out_path,
    line,
    row_number() OVER () as line_num
FROM (
    SELECT 'erDiagram' AS line
    
    UNION ALL
    
    SELECT format(
        '    {:s} {{{:s}}}',
        table_name,
        string_agg(
            lower(
                if(data_type like '%(%',
                    substr(data_type, 1, strpos(data_type, '(') -1),
                    data_type
                )
            ) || ' ' || column_name,
            ' '
        )
    ) AS line
    FROM duckdb_tables() t
    JOIN duckdb_columns() c USING (table_name)
    WHERE table_name LIKE table_pattern
    GROUP BY TABLE_NAME
    
    UNION ALL
    
    SELECT format(
        '    {:s} {:s} {:s} : "{:s}"',
        referenced_table,
        rel_style,
        table_name,
        fk_columns
    ) AS line
    FROM hlp
) sub;

