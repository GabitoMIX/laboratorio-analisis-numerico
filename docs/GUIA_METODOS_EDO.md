# Guía académica de ecuaciones diferenciales ordinarias

## 1. Modelación y problemas de valor inicial
Un PVI parte de `y' = f(x,y)` y `y(x0)=y0`. Ejemplo: crecimiento `y'=0.5y`, `y(0)=10`. Los estudiantes pueden modificar condiciones y paso.

## 2. Leyes de conservación en ingeniería
Ejemplo de tanque perfectamente mezclado a volumen constante: `y'=2-0.2y` (acumulación de masa = caudal másico entrante − saliente). No confundir con conservación de energía o ecuaciones de transporte de mayor dimensión.

## 3. Métodos de solución
- Euler: `y(n+1) = y(n) + h f(x(n),y(n))`.
- Punto medio (Euler mejorado): `k1=f(x,y)`, `k2=f(x+h/2,y+h*k1/2)`, `y_next=y+h*k2`.
- Heun/trapecio explícito: `k1=f(x,y)`, `k2=f(x+h,y+h*k1)`, `y_next=y+h*(k1+k2)/2`.
- Runge-Kutta 4: `k1=f(x,y)`, `k2=f(x+h/2,y+h*k1/2)`, `k3=f(x+h/2,y+h*k2/2)`, `k4=f(x+h,y+h*k3)`, `y_next=y+h*(k1+2k2+2k3+k4)/6`.

*Las k son derivadas; cada producto h·k representa un incremento.*

## 4. Convergencia
Se ejecutan los métodos con `h`, `h/2` y `h/4`. Se muestra la diferencia absoluta frente a un RK4 con paso refinado. No debe llamarse «error verdadero» si no existe solución analítica.

## 5. Estabilidad
La app estima `λ ≈ ∂f/∂y` en la condición inicial. Calcula el factor de amplificación de la linealización para cada método. En la prueba escalar `y'=λy`, con λ negativo, `|R(hλ)| ≤ 1` indica estabilidad absoluta. No generalizar automáticamente a EDO no lineales ni a sistemas.

## 6. Sistemas
Resolver `y'=z`, `z'=-y`, `y(0)=1`, `z(0)=0`. Para validar, comparar con `y=cos(x)` y `z=-sin(x)`; RK4 debe acercarse bien con h pequeño.

## 7. Uso en una exposición
Selecciona primero un modelo, muestra la condición inicial, compara Euler frente a RK4 con el mismo h, visualiza dos o tres pasos, y pasa a la pestaña de convergencia para explicar la precisión. Cierra con el sistema acoplado.
