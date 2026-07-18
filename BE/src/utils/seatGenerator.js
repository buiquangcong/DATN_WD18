/**
 * Tự động tạo sơ đồ ghế/giường dựa trên số chỗ và loại xe
 * @param {number} capacity - Số chỗ của xe (16, 29, 38, 45)
 * @param {string} busType - Loại xe ('Seater' hoặc 'Sleeper')
 * @returns {Array} Mảng chứa thông tin chi tiết từng ghế
 */
const generateSeats = (capacity, busType) => {
    const seats = [];

    if (capacity === 16 && busType === 'Seater') {
        for (let row = 1; row <= 4; row++) {
            seats.push({
                seatCode: `A${row}`,
                rowIndex: row,
                colIndex: 1,
                status: 'AVAILABLE',
                floor: 1
            });
            seats.push({
                seatCode: `B${row}`,
                rowIndex: row,
                colIndex: 3,
                status: 'AVAILABLE',
                floor: 1
            });
            seats.push({
                seatCode: `C${row}`,
                rowIndex: row,
                colIndex: 4,
                status: 'AVAILABLE',
                floor: 1
            });
        }

        const lastRowColumns = ['A', 'B', 'C', 'D'];
        lastRowColumns.forEach((colLetter, index) => {
            seats.push({
                seatCode: `${colLetter}5`,
                rowIndex: 5,
                colIndex: index + 1, // Chiếm trọn từ cột 1 đến cột 4
                status: 'AVAILABLE',
                floor: 1
            });
        });
    }

    else if (capacity === 29 && busType === 'Seater') {
        for (let row = 1; row <= 6; row++) {
            seats.push({ seatCode: `A${row}`, rowIndex: row, colIndex: 1, status: 'AVAILABLE', floor: 1 });
            seats.push({ seatCode: `B${row}`, rowIndex: row, colIndex: 2, status: 'AVAILABLE', floor: 1 });
            
            // 2 ghế dãy bên phải
            seats.push({ seatCode: `C${row}`, rowIndex: row, colIndex: 4, status: 'AVAILABLE', floor: 1 });
            seats.push({ seatCode: `D${row}`, rowIndex: row, colIndex: 5, status: 'AVAILABLE', floor: 1 });
        }

        const lastRowColumns = ['A', 'B', 'C', 'D', 'E'];
        lastRowColumns.forEach((colLetter, index) => {
            seats.push({
                seatCode: `${colLetter}7`,
                rowIndex: 7,
                colIndex: index + 1,
                status: 'AVAILABLE',
                floor: 1
            });
        });
    }
    else if (capacity === 45 && busType === 'Seater') {
        const columns = ['A', 'B', 'C', 'D'];
        for (let row = 1; row <= 10; row++) {
            columns.forEach((colLetter, index) => {
                seats.push({
                    seatCode: `${colLetter}${row}`,
                    rowIndex: row,
                    colIndex: index + 1,
                    status: 'AVAILABLE',
                    floor: 1
                });
            });
        }
        // Hàng 11 (Hàng cuối cùng): 5 ghế liền kề nhau
        const lastRowColumns = ['A', 'B', 'C', 'D', 'E'];
        lastRowColumns.forEach((colLetter, index) => {
            seats.push({
                seatCode: `${colLetter}11`,
                rowIndex: 11,
                colIndex: index + 1,
                status: 'AVAILABLE',
                floor: 1
            });
        });
    } 
    
    else if (capacity === 34 && busType === 'Sleeper') {
        for (let floor = 1; floor <= 2; floor++) {
            const prefix = floor === 1 ? 'A' : 'B';
            
            // Rows 1 to 5: 3 seats per row
            for (let row = 1; row <= 5; row++) {
                const baseNum = (row - 1) * 3;
                
                // colIndex 5: seat code baseNum + 1 (e.g. A1, A4, A7, A10, A13)
                seats.push({
                    seatCode: `${prefix}${baseNum + 1}`,
                    rowIndex: row,
                    colIndex: 5,
                    status: 'AVAILABLE',
                    floor: floor
                });
                
                // colIndex 3: seat code baseNum + 2 (e.g. A2, A5, A8, A11, A14)
                seats.push({
                    seatCode: `${prefix}${baseNum + 2}`,
                    rowIndex: row,
                    colIndex: 3,
                    status: 'AVAILABLE',
                    floor: floor
                });

                // colIndex 1: seat code baseNum + 3 (e.g. A3, A6, A9, A12, A15)
                seats.push({
                    seatCode: `${prefix}${baseNum + 3}`,
                    rowIndex: row,
                    colIndex: 1,
                    status: 'AVAILABLE',
                    floor: floor
                });
            }
            
            // Row 6: 2 seats (A16 at colIndex 3, A17 at colIndex 1)
            // colIndex 5 is empty/WC
            seats.push({
                seatCode: `${prefix}16`,
                rowIndex: 6,
                colIndex: 3,
                status: 'AVAILABLE',
                floor: floor
            });

            seats.push({
                seatCode: `${prefix}17`,
                rowIndex: 6,
                colIndex: 1,
                status: 'AVAILABLE',
                floor: floor
            });
        }
    }

    return seats;
};

export default generateSeats;