// Valores por 100 g (o 100 ml) de alimento, redondeados, tomados como referencia de USDA FoodData Central.
// Son estimaciones: pueden variar según marca, cocción y origen. Verifica con la etiqueta cuando sea posible.
export const FUENTE='Valores de referencia por 100 g basados en USDA FoodData Central, redondeados; son estimaciones, no mediciones. Carbohidratos netos = carbohidratos totales − fibra (definición simple; las etiquetas pueden calcularlo distinto).';
const A=[
// id, nombre, categoría, kcal, proteínas, carbohidratos, fibra, grasas
['huevo','Huevo entero','proteina',143,12.6,.7,0,9.5],
['pollo','Pechuga de pollo cocida','proteina',165,31,0,0,3.6],
['carne','Carne vacuna magra cocida','proteina',217,26,0,0,12],
['atun','Atún al natural','proteina',116,26,0,0,1],
['salmon','Salmón cocido','proteina',206,22,0,0,12],
['merluza','Merluza cocida','proteina',90,19,0,0,1.3],
['mozzarella','Queso mozzarella','lacteo',254,24,3,0,16],
['ricota','Ricota','lacteo',174,11,3,0,13],
['yogur','Yogur griego natural','lacteo',59,10,3.6,0,.4],
['leche','Leche entera','lacteo',61,3.2,4.8,0,3.3],
['espinaca','Espinaca','verdura',23,2.9,3.6,2.2,.4],
['brocoli','Brócoli','verdura',34,2.8,6.6,2.6,.4],
['zapallito','Zapallito / zucchini','verdura',17,1.2,3.1,1,.3],
['tomate','Tomate','verdura',18,.9,3.9,1.2,.2],
['cebolla','Cebolla','verdura',40,1.1,9.3,1.7,.1],
['lechuga','Lechuga','verdura',15,1.4,2.9,1.3,.2],
['pepino','Pepino','verdura',15,.7,3.6,.5,.1],
['pimiento','Pimiento','verdura',31,1,6,2.1,.3],
['coliflor','Coliflor','verdura',25,1.9,5,2,.3],
['zanahoria','Zanahoria','verdura',41,.9,9.6,2.8,.2],
['palta','Palta (aguacate)','grasa',160,2,8.5,6.7,14.7],
['aceite','Aceite de oliva','grasa',884,0,0,0,100],
['mantequilla','Mantequilla','grasa',717,.9,.1,0,81],
['almendras','Almendras','grasa',579,21,22,12.5,50],
['nueces','Nueces','grasa',654,15,14,6.7,65],
['chia','Semillas de chía','grasa',486,17,42,34,31],
['avena','Avena en hojuelas','cereal',389,17,66,10.6,7],
['arroz','Arroz blanco cocido','cereal',130,2.7,28,.4,.3],
['mandioca','Mandioca cocida','cereal',160,1.4,38,1.8,.3],
['batata','Batata cocida','cereal',90,2,21,3.3,.2],
['fideos','Fideos cocidos','cereal',158,5.8,31,1.8,.9],
['pan','Pan integral','cereal',247,13,41,7,3.4],
['lentejas','Lentejas cocidas','legumbre',116,9,20,7.9,.4],
['porotos','Porotos negros cocidos','legumbre',132,8.9,24,8.7,.5],
['banana','Banana','fruta',89,1.1,23,2.6,.3],
['manzana','Manzana','fruta',52,.3,14,2.4,.2],
['frutilla','Frutilla','fruta',32,.7,7.7,2,.3],
['naranja','Naranja','fruta',47,.9,12,2.4,.1]
];
export const ALIMENTOS=A.map(([id,n,cat,kcal,p,c,fi,g])=>({id,n,cat,kcal,p,c,fi,g,base:true}));
const R=(id,n,tags,por,t,ing,pasos)=>({id,n,tags,por,t,ing,pasos,base:true});
export const RECETAS=[
R('r1','Omelette de espinaca y queso',['desayuno'],1,10,[['huevo',150],['espinaca',50],['mozzarella',30],['aceite',5]],['Bate los huevos con una pizca de sal.','Saltea la espinaca 1 minuto en una sartén con el aceite.','Agrega los huevos y el queso, cocina a fuego medio y dobla.']),
R('r2','Huevos revueltos con palta',['desayuno'],1,10,[['huevo',150],['palta',70],['tomate',50],['aceite',5]],['Revuelve los huevos en una sartén con el aceite.','Sirve con la palta en rodajas y el tomate picado.']),
R('r3','Yogur griego con frutillas y nueces',['desayuno'],1,5,[['yogur',200],['frutilla',100],['nueces',15]],['Coloca el yogur en un bowl.','Agrega las frutillas cortadas y las nueces picadas.']),
R('r4','Avena con chía y manzana',['desayuno'],1,10,[['avena',40],['leche',200],['chia',10],['manzana',80]],['Calienta la leche con la avena 4 a 5 minutos.','Agrega la chía y la manzana picada.']),
R('r5','Pollo a la plancha con ensalada',['almuerzo','cena'],1,20,[['pollo',180],['lechuga',80],['tomate',80],['pepino',50],['aceite',10]],['Cocina el pollo en plancha caliente hasta que esté bien cocido.','Mezcla las verduras cortadas y alíñalas con el aceite.']),
R('r6','Carne con brócoli salteado',['almuerzo','cena'],1,25,[['carne',150],['brocoli',150],['cebolla',40],['aceite',10]],['Corta la carne en tiras y dórala en la sartén.','Agrega la cebolla y el brócoli y saltea 6 a 8 minutos.']),
R('r7','Merluza al horno con zapallito',['almuerzo','cena'],1,30,[['merluza',200],['zapallito',150],['aceite',10],['tomate',50]],['Coloca todo en una fuente con el aceite y sal.','Hornea a 200 °C unos 20 minutos.']),
R('r8','Ensalada de atún y huevo',['almuerzo','cena'],1,15,[['atun',120],['huevo',50],['lechuga',100],['tomate',80],['palta',40],['aceite',5]],['Cocina el huevo 10 minutos y pícalo.','Mezcla todos los ingredientes en un bowl.']),
R('r9','Salmón con coliflor',['almuerzo','cena'],1,25,[['salmon',150],['coliflor',200],['aceite',8]],['Hornea el salmón a 200 °C unos 12 a 15 minutos.','Saltea o hierve la coliflor y sirve junto.']),
R('r10','Tortilla de zapallito',['almuerzo','cena'],1,20,[['huevo',150],['zapallito',150],['cebolla',30],['mozzarella',30],['aceite',8]],['Saltea el zapallito y la cebolla.','Agrega los huevos batidos y el queso y cocina de ambos lados.']),
R('r11','Pollo con arroz y verduras',['almuerzo','cena'],1,30,[['pollo',150],['arroz',150],['zanahoria',60],['brocoli',80],['aceite',8]],['Cocina el pollo en cubos con el aceite.','Agrega las verduras picadas y el arroz cocido y mezcla.']),
R('r12','Guiso de lentejas con carne',['almuerzo'],2,45,[['lentejas',400],['carne',160],['zanahoria',100],['cebolla',80],['aceite',10]],['Dora la carne con la cebolla y la zanahoria.','Agrega las lentejas cocidas y un poco de agua; cocina 15 minutos.']),
R('r13','Pollo al horno con batata',['cena'],1,40,[['pollo',180],['batata',150],['pimiento',80],['aceite',8]],['Coloca todo en una fuente con el aceite y sal.','Hornea a 200 °C unos 30 minutos.']),
R('r14','Almendras y manzana',['colacion'],1,2,[['almendras',20],['manzana',100]],['Come las almendras junto con la manzana en trozos.']),
R('r15','Yogur con chía',['colacion'],1,3,[['yogur',150],['chia',8]],['Mezcla el yogur con la chía y deja reposar unos minutos.'])
];
