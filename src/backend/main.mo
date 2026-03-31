import Text "mo:core/Text";
import HttpOutcalls "./http-outcalls/outcall";

actor {

  // --- Types ---

  public type Network = {
    id : Nat;
    name : Text;
    rpcUrl : Text;
  };

  public type MonitoredAddress = {
    id : Nat;
    addrLabel : Text;
    address : Text;
    networkId : Nat;
    minBalance : Float;
  };

  public type BalanceResult = {
    addressId : Nat;
    balance : Text;
    hasError : Bool;
    isBelowThreshold : Bool;
  };

  // --- Stable Storage ---

  stable var networks : [Network] = [];
  stable var addresses : [MonitoredAddress] = [];
  stable var nextNetworkId : Nat = 1;
  stable var nextAddressId : Nat = 1;

  // --- Network CRUD ---

  public func addNetwork(name : Text, rpcUrl : Text) : async Nat {
    let id = nextNetworkId;
    nextNetworkId += 1;
    networks := networks.concat([{ id; name; rpcUrl }]);
    id
  };

  public func updateNetwork(id : Nat, name : Text, rpcUrl : Text) : async Bool {
    var found = false;
    networks := networks.map(func(n : Network) : Network {
      if (n.id == id) { found := true; { id; name; rpcUrl } } else { n };
    });
    found
  };

  public func removeNetwork(id : Nat) : async Bool {
    let before = networks.size();
    networks := networks.filter(func(n : Network) : Bool { n.id != id });
    networks.size() < before
  };

  public query func getNetworks() : async [Network] { networks };

  // --- Address CRUD ---

  public func addAddress(addrLabel : Text, address : Text, networkId : Nat, minBalance : Float) : async Nat {
    let id = nextAddressId;
    nextAddressId += 1;
    addresses := addresses.concat([{ id; addrLabel; address; networkId; minBalance }]);
    id
  };

  public func updateAddress(id : Nat, addrLabel : Text, address : Text, networkId : Nat, minBalance : Float) : async Bool {
    var found = false;
    addresses := addresses.map(func(a : MonitoredAddress) : MonitoredAddress {
      if (a.id == id) { found := true; { id; addrLabel; address; networkId; minBalance } } else { a };
    });
    found
  };

  public func removeAddress(id : Nat) : async Bool {
    let before = addresses.size();
    addresses := addresses.filter(func(a : MonitoredAddress) : Bool { a.id != id });
    addresses.size() < before
  };

  public query func getAddresses() : async [MonitoredAddress] { addresses };

  // --- HTTP Transform ---

  public query func transform(input : HttpOutcalls.TransformationInput) : async HttpOutcalls.TransformationOutput {
    HttpOutcalls.transform(input)
  };

  // --- Balance Helpers ---

  func hexToFloat(hex : Text) : ?Float {
    let arr = hex.chars().toArray();
    let startIdx = if (arr.size() >= 2 and arr[0] == '0' and (arr[1] == 'x' or arr[1] == 'X')) 2 else 0;
    var result : Float = 0.0;
    var i = startIdx;
    while (i < arr.size()) {
      let dOpt : ?Nat = switch (arr[i]) {
        case '0' { ?0 };
        case '1' { ?1 };
        case '2' { ?2 };
        case '3' { ?3 };
        case '4' { ?4 };
        case '5' { ?5 };
        case '6' { ?6 };
        case '7' { ?7 };
        case '8' { ?8 };
        case '9' { ?9 };
        case 'a' { ?10 };
        case 'A' { ?10 };
        case 'b' { ?11 };
        case 'B' { ?11 };
        case 'c' { ?12 };
        case 'C' { ?12 };
        case 'd' { ?13 };
        case 'D' { ?13 };
        case 'e' { ?14 };
        case 'E' { ?14 };
        case 'f' { ?15 };
        case 'F' { ?15 };
        case _ { null };
      };
      switch (dOpt) {
        case null { return null };
        case (?d) { result := result * 16.0 + d.toFloat() };
      };
      i += 1;
    };
    ?result
  };

  // Extract "result" value from JSON-RPC response
  func extractJsonResult(json : Text) : ?Text {
    let chars = json.chars().toArray();
    let dq : Char = '\u{22}';
    let marker : [Char] = [dq, 'r', 'e', 's', 'u', 'l', 't', dq, ':', dq];
    let n = chars.size();
    let m = marker.size();
    var i = 0;
    label search while (i + m <= n) {
      var matched = true;
      var j = 0;
      label checkLoop while (j < m) {
        if (chars[i + j] != marker[j]) {
          matched := false;
          break checkLoop;
        };
        j += 1;
      };
      if (matched) {
        var valueBuf : [Char] = [];
        var k = i + m;
        label collectLoop while (k < n) {
          if (chars[k] == dq) {
            return ?Text.fromIter(valueBuf.vals());
          };
          valueBuf := valueBuf.concat([chars[k]]);
          k += 1;
        };
        break search;
      };
      i += 1;
    };
    null
  };

  // Build JSON-RPC body for eth_getBalance
  func buildRpcBody(addr : Text) : Text {
    let dq = "\u{22}";
    "{" # dq # "jsonrpc" # dq # ":" # dq # "2.0" # dq # "," # dq # "method" # dq # ":" # dq # "eth_getBalance" # dq # "," # dq # "params" # dq # ":[" # dq # addr # dq # "," # dq # "latest" # dq # "]," # dq # "id" # dq # ":1}"
  };

  // --- Balance Fetching ---

  public func fetchBalance(addressId : Nat) : async BalanceResult {
    let errResult = { addressId; balance = "Error"; hasError = true; isBelowThreshold = false };
    switch (addresses.find(func(a : MonitoredAddress) : Bool { a.id == addressId })) {
      case null { errResult };
      case (?addr) {
        switch (networks.find(func(n : Network) : Bool { n.id == addr.networkId })) {
          case null { errResult };
          case (?net) {
            try {
              let response = await HttpOutcalls.httpPostRequest(
                net.rpcUrl,
                [{ name = "Content-Type"; value = "application/json" }],
                buildRpcBody(addr.address),
                transform,
              );
              switch (extractJsonResult(response)) {
                case null { errResult };
                case (?hexBalance) {
                  let isBelowThreshold = switch (hexToFloat(hexBalance)) {
                    case null { false };
                    case (?weiFloat) { (weiFloat / 1_000_000_000_000_000_000.0) < addr.minBalance };
                  };
                  { addressId; balance = hexBalance; hasError = false; isBelowThreshold };
                };
              };
            } catch (_) { errResult };
          };
        };
      };
    };
  };

  public func fetchAllBalances() : async [BalanceResult] {
    var results : [BalanceResult] = [];
    for (addr in addresses.vals()) {
      results := results.concat([await fetchBalance(addr.id)]);
    };
    results
  };

};
