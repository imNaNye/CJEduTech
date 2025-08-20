// ad-hoc 테스트
import bcrypt from 'bcrypt';
console.log(await bcrypt.compare('password', '$2b$10$.KsSX9L01EoaUNVjvgmGaug01r032VcpBYJLAGM6mTLWijz6sABle'));