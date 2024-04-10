SELECT reservations.id, properties.title, reservations.start_date, avg(rating) as average_rating
FROM reservations
JOIN properties on reservations.property_id = properties.id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = 1
GROUP BY properties.id, reservations.id
ORDER BY reservations.start_date
LIMIT 10
;