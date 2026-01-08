-- Update receipt number generation to use full season configuration
-- Format: P/<season_code>/<season_number><2 digit year>/<6 digit running number>
-- Append -demo if mode is not LIVE
-- Example: P/S2/225/000001 or P/S2/225/000001-demo

DROP PROCEDURE IF EXISTS sp_generate_receipt_number;

DELIMITER $$

CREATE PROCEDURE sp_generate_receipt_number(
    IN p_season_id INT UNSIGNED,
    OUT p_receipt_number VARCHAR(30)
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
    
    -- Build season prefix: P/<season_code>/<season_number><2digit_year>
    SET v_season_prefix = CONCAT('P/', v_season_code, '/', v_season_number, v_year_2digit);
    
    -- Determine demo suffix
    SET v_demo_suffix = IF(v_mode = 'LIVE', '', '-demo');
    
    -- Get next running number for this season
    -- Look for receipts that start with the season prefix (excluding demo suffix)
    SELECT IFNULL(MAX(
        CAST(
            REPLACE(
                SUBSTRING_INDEX(receipt_number, '/', -1),
                '-demo',
                ''
            ) AS UNSIGNED
        )
    ), 0) + 1
    INTO v_next_number
    FROM purchase_transactions
    WHERE season_id = p_season_id
      AND receipt_number LIKE CONCAT(v_season_prefix, '/%');
    
    -- Build final receipt number: P/<season_code>/<season_number><2digit_year>/<6 digit running number>[-demo]
    SET p_receipt_number = CONCAT(v_season_prefix, '/', LPAD(v_next_number, 6, '0'), v_demo_suffix);
END$$

DELIMITER ;
