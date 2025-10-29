pragma solidity ^0.8.0;
contract MultiSignPaymentWallet {
    address[]public owners;
    uint public requiredApprovals;
    mapping (address=>bool) public isOwner;
 
    struct Transaction {
        address to;
        uint amount;
        uint approvalCount;
        bool executed;
    }
 
    Transaction[] public transactions;
    mapping(uint => mapping(address=>bool)) public approvals;
    //ContratoPagos
    address[] public payees;
    mapping(address=>uint) public shares;
    uint256 public totalShares;
    //------------
    uint256 private _status;
    modifier nonReentrant(){
        require(_status!=2,"Reentrancy Guard:Reentrant call");
        _status=2;
        _;
        _status=1;
    }
    event Deposit(address indexed sender, uint amount);
    event TransactionSubmitted(uint indexed txId, address indexed to, uint amount);
    event TransactionApproved(uint indexed txId, address owner);
    event TransactionExecuted(uint indexed txId, address indexed to, uint amount);
    event PaymentReleased(address indexed payee, uint amount);
 
    modifier onlyOwner(){
        require(isOwner[msg.sender]);
        _;
    }
    constructor(
        address[] memory _owners,
        uint _requiredApprovals,
        address[] memory _payees,
        uint256[] memory _shares
    ){
        _status = 1;
        require(_owners.length > 0, "Must have owners");
        require(_requiredApprovals > 0 && _requiredApprovals  <= _owners.length, "Invalid Approvals");
        for(uint i=0;i<_owners.length;i++){
            address owner = _owners[i];
            require(owner != address(0),"Invalid Address");
            require(!isOwner[owner],"Owner not unique");
            isOwner[owner] = true;
            owners.push(owner);
        }
        requiredApprovals = _requiredApprovals;
        //ContratoPagos
        require(_payees.length == _shares.length, "Length mismatch");
        require(_payees.length > 0, "No payees");
        for (uint i=0;i<_payees.length;i++){
            require(_payees[i]!=address(0),"Invalid address");
            require(_shares[i]>0, "Shares must be >0");
            payees.push(_payees[i]);
            shares[_payees[i]]=_shares[i];
            totalShares+=_shares[i];
        }
    }
 
    function deposit() public payable{
        require(msg.value>0, "Debes mandar ether");
        emit Deposit(msg.sender,msg.value);
    }
    function SubmitTransaction(address _to, uint amount) external onlyOwner{
        require(_to!=address(0), "Invalid Address");
        require(amount>0, "Invalid Amount");
        transactions.push(
            Transaction({
                to:_to,
                amount:amount,
                approvalCount:0, executed:false
            })
        );
        emit TransactionSubmitted(transactions.length-1,_to,amount);
    }

    // Agregar al inicio, junto a tus variables y structs
    struct ApprovalInfo {
        address approver;
        uint256 timestamp;
    }

    // Guardamos historial por txId
    mapping(uint => ApprovalInfo[]) public approvalHistory;

    function approveTransaction(uint txId) external onlyOwner(){
        Transaction storage transaction = transactions[txId];
        require(!transaction.executed,"Already executed");
        require(!approvals[txId][msg.sender],"Already approved");
        approvals[txId][msg.sender] = true;
        transaction.approvalCount++;

        // Guardamos histórico con timestamp
        approvalHistory[txId].push(ApprovalInfo({
            approver: msg.sender,
            timestamp: block.timestamp
        }));

        emit TransactionApproved(txId, msg.sender);
    }

    // Nueva función para obtener historial completo de aprobaciones
    function getApprovalHistory(uint txId) public view returns (ApprovalInfo[] memory) {
        return approvalHistory[txId];
    }

    function executeTransaction(uint txId) external onlyOwner nonReentrant{
        Transaction storage transaction = transactions[txId];
        require(transaction.approvalCount>=requiredApprovals, "Not enough approvals");
        require(!transaction.executed,"Already executed");
        transaction.executed = true;
        (bool success,)= payable(transaction.to).call{value:transaction.amount}("");
        require(success, "Transaction failed");
        emit TransactionExecuted(txId, transaction.to, transaction.amount);
    }
    function releasePayments() external onlyOwner nonReentrant{
        uint256 balance = address(this).balance;
        require(balance>0,"No hay fondos");
        for(uint256 i = 0; i < payees.length; i++){
            address payee = payees[i];
            uint256 payment = (balance * shares[payee]) / totalShares;
            (bool success,) = payee.call{value:payment}("");
            require(success, "Transaction failed");
            emit PaymentReleased(payee, payment);
        }
    }

    function getTransactions() external view returns(Transaction[] memory){
        return transactions;
    }
    function getBalance() external view returns(uint256){
        return address(this).balance;
    }

    struct Product {
        uint id;
        string name;
        uint price;
        address seller;
        bool active;
    }

    uint public nextProductId;
    mapping(uint => Product) public products;
    mapping(address => uint[]) public purchases;

    event ProductAdded(uint id, string name, uint price, address seller);
    event ProductPurchased(uint id, address buyer, uint price);

    function addProduct(string memory _name, uint _price) external onlyOwner {
        require(_price > 0, "El precio debe ser mayor a 0");
        uint productId = nextProductId++;
        products[productId] = Product({
            id: productId,
            name: _name,
            price: _price,
            seller: msg.sender,
            active: true
        });
        emit ProductAdded(productId, _name, _price, msg.sender);
    }

    function buyProduct(uint _productId) external payable nonReentrant {
        Product storage product = products[_productId];
        require(product.active, "Producto no disponible");
        require(msg.value == product.price, "Monto incorrecto");

        emit Deposit(msg.sender, msg.value);

        purchases[msg.sender].push(_productId);
        emit ProductPurchased(_productId, msg.sender, product.price);
    }

    function disableProduct(uint _productId) external onlyOwner {
        products[_productId].active = false;
    }

    function getAllProducts() external view returns (Product[] memory) {
        Product[] memory all = new Product[](nextProductId);
        for (uint i = 0; i < nextProductId; i++) {
            all[i] = products[i];
        }
        return all;
    }
}