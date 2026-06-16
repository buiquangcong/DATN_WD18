const generateSeats = (capacity, busType) => {
    const seats = [];

    // Cấu hình xe ghế ngồi 45 chỗ (A, B, C, D)
    if (capacity === 45 && busType === 'Seater') {
        const columns = ['A', 'B', 'C', 'D'];
        for (let row = 1; row <= 11; row++) {
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
        // Ghế thứ 45 ở hàng cuối cùng
        seats.push({
            seatCode: 'G45',
            rowIndex: 11,
            colIndex: 2.5,
            status: 'AVAILABLE',
            floor: 1
        });
    } 
    
    // Cấu hình xe giường nằm 38 chỗ (A, B, C x 2 tầng)
    else if (capacity === 38 && busType === 'Sleeper') {
        const columns = ['A', 'B', 'C'];
        for (let floor = 1; floor <= 2; floor++) {
            for (let row = 1; row <= 6; row++) {
                columns.forEach((colLetter, index) => {
                    seats.push({
                        seatCode: `${colLetter}${row}${floor === 1 ? 'D' : 'T'}`,
                        rowIndex: row,
                        colIndex: index + 1,
                        status: 'AVAILABLE',
                        floor: floor
                    });
                });
            }
        }
        // 2 giường bổ sung ở tầng dưới
        seats.push({ seatCode: 'X37D', rowIndex: 6, colIndex: 1.5, status: 'AVAILABLE', floor: 1 });
        seats.push({ seatCode: 'X38D', rowIndex: 6, colIndex: 2.5, status: 'AVAILABLE', floor: 1 });
    }

    return seats;
};

export default generateSeats;