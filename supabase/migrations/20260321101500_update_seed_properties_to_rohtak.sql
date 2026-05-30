update public.properties
set
  location = case location
    when 'Banjara Hills, Hyderabad' then 'Model Town, Rohtak'
    when 'Gachibowli, Hyderabad' then 'Sector 21, Rohtak'
    when 'Jubilee Hills, Hyderabad' then 'Sector 25, Rohtak'
    when 'Outer Ring Road, Hyderabad' then 'Sector 27, Rohtak'
    when 'Hitech City, Hyderabad' then 'Sector 35, Rohtak'
    when 'Kondapur, Hyderabad' then 'Omaxe City, Rohtak'
    else location
  end,
  description = case location
    when 'Banjara Hills, Hyderabad' then 'Verified residential house in Model Town, Rohtak.'
    when 'Gachibowli, Hyderabad' then 'Residential flat in Sector 21, Rohtak with strong connectivity.'
    when 'Jubilee Hills, Hyderabad' then 'Large residential property in Sector 25, Rohtak.'
    when 'Outer Ring Road, Hyderabad' then 'Agricultural parcel positioned near Sector 27, Rohtak.'
    when 'Hitech City, Hyderabad' then 'Commercial space in Sector 35, Rohtak for office or retail use.'
    when 'Kondapur, Hyderabad' then 'Compact residential flat in Omaxe City, Rohtak.'
    else description
  end
where location in (
  'Banjara Hills, Hyderabad',
  'Gachibowli, Hyderabad',
  'Jubilee Hills, Hyderabad',
  'Outer Ring Road, Hyderabad',
  'Hitech City, Hyderabad',
  'Kondapur, Hyderabad'
);
