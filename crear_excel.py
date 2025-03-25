import pandas as pd

# Datos (tal cual me los pasaste)
products = [
    {"id":"001","name":"Cartera Milano","description":"Cartera elegante de cuero sintético","category":"Carteras","price":45.99,"boxPrice":220.00,"unitMeasure":"unidad","weight":"0.5kg","height":"25cm","width":"35cm","depth":"10cm","colors":["Negro","Camel","Rojo"],"sizes":[],"unitsPerBox":5,"images":["/placeholder.svg?height=400&width=300"]},
    {"id":"002","name":"Bufanda Cashmere","description":"Bufanda suave y cálida","category":"Bufandas","price":29.99,"boxPrice":135.00,"unitMeasure":"unidad","weight":"0.2kg","height":"180cm","width":"30cm","depth":"0.5cm","colors":["Gris","Beige","Azul marino"],"sizes":[],"unitsPerBox":5,"images":["/placeholder.svg?height=400&width=300"]},
    {"id":"003","name":"Zapatos Elegance","description":"Zapatos de tacón medio","category":"Zapatos","price":59.99,"boxPrice":270.00,"unitMeasure":"par","weight":"0.8kg","height":"10cm","width":"25cm","depth":"15cm","colors":["Negro","Nude"],"sizes":["36","37","38","39","40"],"unitsPerBox":5,"images":["/placeholder.svg?height=400&width=300"]},
    {"id":"004","name":"Collar Perlas","description":"Collar de perlas sintéticas","category":"Collares","price":25.99,"boxPrice":115.00,"unitMeasure":"unidad","weight":"0.1kg","height":"2cm","width":"40cm","depth":"2cm","colors":["Blanco","Rosado"],"sizes":[],"unitsPerBox":5,"images":["/placeholder.svg?height=400&width=300"]},
    {"id":"005","name":"Aritos Bohemian","description":"Aritos colgantes estilo bohemio","category":"Aritos","price":15.99,"boxPrice":70.00,"unitMeasure":"par","weight":"0.05kg","height":"5cm","width":"2cm","depth":"0.5cm","colors":["Dorado","Plateado"],"sizes":[],"unitsPerBox":5,"images":["/placeholder.svg?height=400&width=300"]},
    {"id":"006","name":"Cartera Tote","description":"Cartera grande estilo tote","category":"Carteras","price":49.99,"boxPrice":225.00,"unitMeasure":"unidad","weight":"0.7kg","height":"35cm","width":"45cm","depth":"15cm","colors":["Negro","Marrón","Azul"],"sizes":[],"unitsPerBox":5,"images":["/placeholder.svg?height=400&width=300"]}
]

category_emojis = {
    "Carteras":"👜","Bufandas":"🧣","Zapatos":"👠","Collares":"📿","Aritos":"💎","Pulseras":"⌚","Sombreros":"👒","Lentes":"👓"
}

# Preparar DataFrames
df_products = pd.DataFrame(products)
for col in ("colors", "sizes", "images"):
    if col in df_products.columns:
        df_products[col] = df_products[col].apply(lambda arr: ", ".join(arr))
    else:
        print(f"⚠️ Columna no encontrada: {col}")

df_categories = pd.DataFrame(category_emojis.items(), columns=["Category","Emoji"])

# Escribir Excel
with pd.ExcelWriter("catalogo_productos.xlsx"
"", engine="openpyxl") as writer:
    df_products.to_excel(writer, sheet_name="Productos", index=False)
    df_categories.to_excel(writer, sheet_name="CategoryEmojis", index=False)

print("✅ catalogo_productos.xlsx creado exitosamente")
