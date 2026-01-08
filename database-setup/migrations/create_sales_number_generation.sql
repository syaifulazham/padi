-- Create sales number generation stored procedure
-- Format: S/<season_code>/<season_number><2 digit year>/<6 digit running number>
-- Append -demo if mode is not LIVE
-- Example: S/S2/225/000001 or S/S2/225/000001-demo

DROP PROCEDURE IF EXISTS sp_generate_sales_number;

DELIMITER $$

CREATE PROCEDURE sp_generate_sales_number(
    IN p_season_id INT UNSIGNED,
    OUT p_sales_number VARCHAR(30)
)
BEGIN
    DECLARE v_season_code VARCHAR(20);
    DECLARE v_season_number INT;
    DECLARE v_year VARCHAR(4);
    DECLARE v_year_2digit VARCHAR(2);
    DECLARE v_mode VARCHAR(10);
    DECLARE v_next_number INT;
    DECLARE v_season_prefix VARCHAR(30);
    DECLARE v_demo_suffix VARCHAR(10);
    
    -- Get season configuration
    SELECT 
        season_code,
        season_number,
        year,
        mode
    INTO 
        v_season_code,
        v_season_number,
        v_year,
        v_mode
    FROM harvesting_seasons
    WHERE season_id = p_season_id;
    
    -- Get last 2 digits of year
    SET v_year_2digit = RIGHT(v_year, 2);
    
    -- Build season prefix: S/<season_code>/<season_number><2digit_year>
    SET v_season_prefix = CONCAT('S/', v_season_code, '/', v_season_number, v_year_2digit);
    
    -- Determine demo suffix
    SET v_demo_suffix = IF(v_mode = 'LIVE', '', '-demo');
    
    -- Get next running number for this season
    -- Look for sales that start with the season prefix (excluding demo suffix)
    SELECT IFNULL(MAX(
        CAST(
            REPLACE(
                SUBSTRING_INDEX(sales_number, '/', -1),
                '-demo',
                ''
            ) AS UNSIGNED
        )
    ), 0) + 1
    INTO v_next_number
    FROM sales_transactions
    WHERE season_id = p_season_id
      AND sales_number LIKE CONCAT(v_season_prefix, '/%');
    
    -- Build final sales number: S/<season_code>/<season_number><2digit_year>/<6 digit running number>[-demo]
    SET p_sales_number = CONCAT(v_season_prefix, '/', LPAD(v_next_number, 6, '0'), v_demo_suffix);
END$$

DELIMITER ;
