export interface DecodedToken {
  upn?: string;   // Quarkus SmallRye JWT: Jwt.upn() seta este claim
  sub?: string;   // fallback padrão JWT
  groups: string[];
  iss: string;
  exp: number;
  iat?: number;
  parish?: number;
}
